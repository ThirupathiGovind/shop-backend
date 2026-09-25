import bcrypt from 'bcryptjs'
import { PASSWORD_SALT_ROUNDS } from '../constants.js'

const users = [
  {
    name: 'Admin User',
    phoneNumber: '9543260339',
    email: 'admin@example.com',
    password: bcrypt.hashSync('123456', PASSWORD_SALT_ROUNDS),
    isAdmin: true,
  },
  {
    name: 'John Doe',
    phoneNumber: '9543260340',
    email: 'john@example.com',
    password: bcrypt.hashSync('123456', PASSWORD_SALT_ROUNDS),
  }
]

export default users
