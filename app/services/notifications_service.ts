import { inject } from '@adonisjs/core'
import { templateEngine } from '#infrastructure/providers/template-engine'
import {
  AssignTicketTemplateView,
  CancelTicketTemplateView,
  CloseTicketTemplateView,
  OpenTicketTemplateView,
} from '#infrastructure/email-templates/index'
import { AuthenticatedUserInfo } from '#application/helpers/authenticated_user_info'
import { NotificationsContract } from '#contracts/notifications_contract'
import { emailClient } from '#infrastructure/providers/email-client'
import { getTicketById } from '#repositories/ticket_repository'
import { getUsersByClientId } from '#repositories/user_repository'
import Result from '#application/common/enums/result'
import Ticket from '#models/ticket'
import Checkpoint, { CheckpointTypeEnum } from '#models/checkpoint'
import Zone from '#models/zone'
import { emailDateTimeFormat } from '#infrastructure/helpers/datetime-formater'
import { Roles } from '#models/role'
import { TicketsActivityStatus } from '#models/ticket-activity'
import { getUserInvitationById } from '#repositories/user_invitation_repository'
import { JoinInvitationtMobileTemplateView } from '#infrastructure/email-templates/account/join-invitation-mobile-view'
import { JoinInvitationtWebTemplateView } from '#infrastructure/email-templates/account/join-invitation-web-view'
import UserInvitation from '#models/user_invitation'
import { AppLogger } from '#infrastructure/providers/app-logger'
import User from '#models/user'
import { log } from 'console'
import FCMServiceInstance from "#infrastructure/providers/fcm-service";

@inject()
export class NotificationsService implements NotificationsContract {
  constructor(protected appLogger: AppLogger) {}

  async sendOpenTicketEmail(ticketId: string): Promise<Result<Ticket>> {
    this.appLogger.info(`Open ticket email notification request: ${ticketId}`)

    const ticket = await getTicketById(ticketId, this.appLogger)

    if (ticket === null) return Result.fromException(Error('Ticket was not found'))

    if (ticket.user_transmitter_id === null) return Result.fromException(Error('Ticket has no dispatcher'))

    const users = await getUsersByClientId(
      ticket.client_id,
      this.appLogger,
      AuthenticatedUserInfo.token ?? ''
    )

    const zone = this._getTicketCheckpointZone(ticket.checkpoint)
    const openTicketTemplateView: OpenTicketTemplateView = {
      id: `#${ticket.id.substring(0, 8)}`,
      name: ticket.name,
      description: ticket.description,
      image: !!ticket.picture_open_ticket ? ticket.picture_open_ticket[0] : '',
      transmitter_name: `${ticket.user_transmitter_id.first_name} ${ticket.user_transmitter_id.last_name}`,
      transmitter_email: ticket.user_transmitter_id.email,
      transmitter_phone: `${ticket.user_transmitter_id.country_code} ${ticket.user_transmitter_id.mobile}`,
      site_location: zone?.site_location?.name || '--',
      link: 'http://www.workernav.com',
    }

    this.appLogger.info(
      `Sending Open ticket email with view: ${JSON.stringify(openTicketTemplateView)}`
    )

    const dispatchers = (users ?? []).filter(
      (u) =>
        u.role.name === Roles.DISPATCHER ||
        u.role.name === Roles.ADMIN ||
        u.role.name === Roles.OWNER
    )
    const dispatchersEmails = dispatchers
      ?.filter((u) => u.email !== ticket.user_transmitter_id?.email)
      .map((u) => u.email)
    if (dispatchersEmails && dispatchersEmails.length > 0) {
      const dispatchersEmailTemplate = await templateEngine.render<OpenTicketTemplateView>(
        'ticket/open-ticket-dispatchers',
        openTicketTemplateView
      )
      await emailClient.sendMail({
        to: dispatchersEmails,
        subject: 'New ticket created on Worker Nav',
        body: dispatchersEmailTemplate,
      })

      this.appLogger.info(`Open ticket email sent to dispatchers: ${dispatchersEmails.toString()}`)
    }

    const transmitterEmailTemplate = await templateEngine.render<OpenTicketTemplateView>(
      'ticket/open-ticket-transmitter',
      openTicketTemplateView
    )
    await emailClient.sendMail({
      to: ticket.user_transmitter_id.email,
      subject: 'Open ticket confirmation on Worker Nav',
      body: transmitterEmailTemplate,
    })

    this.appLogger.info(`Open ticket email sent to transmitter: ${ticket.user_transmitter_id.email}`)

    return Result.fromValue(ticket)
  }

  async sendAssignTicketEmail(ticketId: string): Promise<Result<Ticket>> {
    this.appLogger.info(`Assign ticket email notification request: ${ticketId}`)

    const ticket = await getTicketById(ticketId, this.appLogger)


    if (ticket === null) return Result.fromException(Error('Ticket was not found'))

    if (
      ticket.user_transmitter_id === null )
      return Result.fromException(Error('Ticket missing required actors'))
    const zone = this._getTicketCheckpointZone(ticket.checkpoint)


    const assignTicketTemplateView: AssignTicketTemplateView = {
      id: `#${ticket.id.split('-').at(-1).substring(0, 8)}`,
      name: ticket.name,
      description: ticket.description,
      image: !!ticket.picture_open_ticket ? ticket.picture_open_ticket[0] : '',
      receiver_email: ticket.associates.reduce((ac: string, v: User) => `${ac}${v.email},`, '').slice(0, -1).trim(),
      transmitter_name: `${ticket.user_transmitter_id?.first_name} ${ticket.user_transmitter_id?.last_name}`,
      site_location: zone?.site_location?.name || '--',
      link: 'http://www.workernav.com',
    }


    log(assignTicketTemplateView)

    this.appLogger.info(
      `Sending Assign ticket email with view: ${JSON.stringify(assignTicketTemplateView)}`
    )

    const receivers = [ticket.user_master_id,...ticket.associates]
    const ccEmails = [ticket.user_transmitter_id?.email ?? null, ticket.user_dispatcher_id?.email ?? null].filter(
      (e) => e !== null
    )
    const emailTemplate = await templateEngine.render<AssignTicketTemplateView>(
      'ticket/assign-ticket',
      assignTicketTemplateView
    )
    await emailClient.sendMail({
      to: ticket.user_master_id.email,
      subject: 'Ticket assigned on Worker Nav',
      body: emailTemplate,
    })

    if(ticket.transmitter.fcm){
      await  FCMServiceInstance.sendNotification(ticket.transmitter.fcm, {
        title: ticket.transmitter.prefered_language == 'fr' ? `Ticket assigné - #${ticket.id.split('-').at(-1).substring(0,8)}` : `Ticket assigned - #${ticket.id.split('-').at(-1).substring(0,8)}`,
        body: ticket.name,
        data: { id: ticket.id },
      }, );
    }

    await  FCMServiceInstance.sendNotificationToUserByLocal({'fr': receivers.filter((e:User)=> e.prefered_language == "fr" && e.fcm  != null ).map((e:User)=>e.fcm!), 'en': receivers.filter((e:User)=> e.prefered_language != "fr" && e.fcm  != null ).map((e:User)=>e.fcm!)}, {'fr':{
        'title': `Nouveau ticket - #${ticket.id.split('-').at(-1).substring(0, 8)}`,
        'body': ticket.name,
        'data': { id: ticket.id, type: "ASSIGNED_TICKET"},
      },
      'en':{
        'title': `New ticket - #${ticket.id.split('-').at(-1).substring(0, 8)}`,
        'body': ticket.name,
        'data': { id: ticket.id, type: "ASSIGNED_TICKET" },
      },

    },);
    this.appLogger.info(
      `Assign ticket email sent to workers: ${receivers.toString()}, ${ccEmails.toString()}`
    )

    return Result.fromValue(ticket)
  }

  async sendCloseTicketEmail(ticketId: string): Promise<Result<Ticket>> {
    this.appLogger.info(`Close ticket email notification request: ${ticketId}`)

    const ticket = await getTicketById(ticketId, this.appLogger)
    if (ticket === null) return Result.fromException(Error('Ticket was not found'))

    if (
      ticket.user_transmitter_id === null ||
      ticket.receiver_ticket === null ||
      ticket.receiver_ticket.length <= 0
    )
      return Result.fromException(Error('Ticketmissing required actors'))

    const zone = this._getTicketCheckpointZone(ticket.checkpoint)
    const ticket_activity = ticket.ticket_activity?.find(
      (a:any) => a.ticket_activity_status.name === TicketsActivityStatus.FINISH
    )
    const ticket_manager = ticket.user_master_id
    const closeTicketTemplateView: CloseTicketTemplateView = {
      id: `#${ticket.id.substring(0, 8)}`,
      name: ticket.name,
      description: ticket.description,
      image: !!ticket.picture_open_ticket ? ticket.picture_open_ticket[0] : '',
      transmitter_name: `${ticket.user_transmitter_id.first_name} ${ticket.user_transmitter_id.last_name}`,
      receiver_name: `${ticket_manager?.first_name} ${ticket_manager?.last_name}`,
      site_location: zone?.site_location?.name ?? '--',
      action_comment: ticket_activity?.external_comment ?? '--',
      closed_datetime: !!ticket_activity?.created_at
        ? emailDateTimeFormat(ticket_activity?.created_at)
        : '--',
      link: 'http://www.workernav.com',
    }

    this.appLogger.info(
      `Sending Close ticket email with view: ${JSON.stringify(closeTicketTemplateView)}`
    )

    const receivers = ticket.associates.map((u:User) => u.email)
    const ccEmails = [ticket.user_transmitter_id?.email ?? null, ticket.user_dispatcher_id?.email ?? null].filter(
      (e) => e !== null
    )
    const emailTemplate = await templateEngine.render<CloseTicketTemplateView>(
      'ticket/close-ticket',
      closeTicketTemplateView
    )
    await emailClient.sendMail({
      to: ticket.transmitter.email,
      subject: 'Ticket is closed on Worker Nav',
      body: emailTemplate,
    })

    this.appLogger.info(
      `Close ticket email sent to workers: ${receivers.toString()}, ${ccEmails.toString()}`
    )

    return Result.fromValue(ticket)
  }

  async sendCancelTicketEmail(ticketId: string): Promise<Result<Ticket>> {
    this.appLogger.info(`Cancel ticket email notification request: ${ticketId}`)

    const ticket = await getTicketById(ticketId, this.appLogger)
    if (ticket === null) return Result.fromException(Error('Ticket was not found'))

    if (
      ticket.user_transmitter_id === null ||
      ticket.receiver_ticket === null ||
      ticket.receiver_ticket.length <= 0
    )
      return Result.fromException(Error('Ticket missing required actors'))

    const zone = this._getTicketCheckpointZone(ticket.checkpoint)
    const ticket_activity = ticket.ticket_activity?.find(
      (a:any) => a.ticket_activity_status.name === TicketsActivityStatus.CANCEL
    )
    const cancelTicketTemplateView: CancelTicketTemplateView = {
      id: `#${ticket.id.substring(0, 8)}`,
      name: ticket.name,
      description: ticket.description,
      image: !!ticket.picture_open_ticket ? ticket.picture_open_ticket[0] : '',
      transmitter_name: `${ticket.user_transmitter_id.first_name} ${ticket.user_transmitter_id.last_name}`,
      canceled_by: `${ticket_activity?.created_by?.first_name} ${ticket_activity?.created_by?.last_name}`,
      action_comment: ticket_activity?.external_comment ?? '--',
      site_location: zone?.site_location?.name || '--',
      canceled_datetime: !!ticket_activity?.created_at
        ? emailDateTimeFormat(ticket_activity?.created_at)
        : '--',
      link: 'http://www.workernav.com',
    }

    this.appLogger.info(
      `Sending Cancel ticket email with view: ${JSON.stringify(cancelTicketTemplateView)}`
    )

    const receivers = ticket.associates.map((u:User) => u.email)
    const ccEmails = [ticket.user_transmitter_id?.email ?? null, ticket.user_dispatcher_id?.email ?? null].filter(
      (e) => e !== null
    )
    const emailTemplate = await templateEngine.render<CancelTicketTemplateView>(
      'ticket/cancel-ticket',
      cancelTicketTemplateView
    )
    await emailClient.sendMail({
      to: ticket.transmitter.email,
      subject: 'Ticket is canceled on Worker Nav',
      body: emailTemplate,
    })

    this.appLogger.info(
      `Cancel ticket email sent to workers: ${receivers.toString()}, ${ccEmails.toString()}`
    )

    return Result.fromValue(ticket)
  }


  async sendJoinInvitationEmail(
    userInvitationId: string,
    isProd: boolean
  ): Promise<Result<UserInvitation>> {
    this.appLogger.info(`Join Invitation email notification request: ${userInvitationId}`)

    const userInvitation = await getUserInvitationById(
      userInvitationId,
      this.appLogger,
      AuthenticatedUserInfo.token ?? ''
    )

    if (userInvitation === null) return Result.fromException(Error('User invitation was not found'))

    if (!userInvitation.email)
      return Result.fromException(Error('User invitation has no valid email'))

    let invitationEmailTemplate: string | null = null
    if (userInvitation.role.name === Roles.WORKER ) {
      const invitationTemplateView: JoinInvitationtMobileTemplateView = {
        email: userInvitation.email,
        otp: `${userInvitation.otp}`,
      }
      invitationEmailTemplate = await templateEngine.render(
        'account/join-invitation-mobile',
        invitationTemplateView
      )

      this.appLogger.info(
        `Sending Open ticket email with view: ${JSON.stringify(invitationTemplateView)}`
      )
    } else if (
      userInvitation.role.name === Roles.OWNER ||
      userInvitation.role.name === Roles.ADMIN ||
      userInvitation.role.name === Roles.DISPATCHER || userInvitation.role.name === Roles.REQUESTOR
    ) {
      const invitationTemplateView: JoinInvitationtWebTemplateView = {
        email: userInvitation.email,
        confirmation_URL: isProd
          ? `https://workernav.com/user-invitation?id=${userInvitation.id}`
          : `https://next-worker-nav-development-five.vercel.app/user-invitation?id=${userInvitation.id}`,
      }
      invitationEmailTemplate = await templateEngine.render(
        'account/join-invitation-web',
        invitationTemplateView
      )

      this.appLogger.info(
        `Sending Join Invitation email with view: ${JSON.stringify(invitationTemplateView)}`
      )
    }

    if (invitationEmailTemplate === null)
      return Result.fromException(Error('No email template was found'))

    await emailClient.sendMail({
      to: userInvitation.email,
      subject: 'You have been invited',
      body: invitationEmailTemplate,
    })

    this.appLogger.info(`Join Invitation email sent to workers: ${userInvitation.email}`)

    return Result.fromValue(userInvitation)
  }

  private _getTicketCheckpointZone(checkpoint: Checkpoint | null): Zone | null {
    if (checkpoint === null) return null

    if (checkpoint.checkpoint_type?.name === CheckpointTypeEnum.ASSET) {
      return checkpoint.asset?.zone ?? null
    } else if (checkpoint.checkpoint_type?.name === CheckpointTypeEnum.SPOT) {
      return checkpoint.spot?.zone ?? null
    } else if (checkpoint.checkpoint_type?.name === CheckpointTypeEnum.CHECKER) {
      return checkpoint.checker?.zone ?? null
    }

    return null
  }
}
