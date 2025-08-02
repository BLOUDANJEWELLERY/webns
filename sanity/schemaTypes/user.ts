// /schemas/user.ts
export default {
  name: 'user',
  type: 'document',
  title: 'Users',
  fields: [
    { name: 'name', type: 'string', title: 'Name' },
    { name: 'email', type: 'string', title: 'Email' },
    { name: 'password', type: 'string', title: 'Password' },
  ],
}