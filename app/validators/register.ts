import vine from '@vinejs/vine'

export const RegisterValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3),
    email: vine.string().email(),
    // .unique(async (db, value, field) => {
    //   const user = await db
    //     .from('User')
    //     // .whereNot('id',1) field.meta.id
    //     .where('email', value)
    //     .first()
    //   return !user
    // }),
    password: vine.string().minLength(8),
  })
)
