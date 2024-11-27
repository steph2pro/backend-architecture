import vine from '@vinejs/vine'

export const LoginValidator = vine.compile(
  vine.object({
    identifier: vine.string(), // Validation de base
    password: vine.string().minLength(8),
  })
);

