import bcrypt from 'bcryptjs'

const users = [
  {
    name: 'Admin User',
    phoneNumber: '9543260339',
    email: 'admin@example.com',
    password: bcrypt.hashSync('123456', 10),
    isAdmin: true,
  },
  {
    name: 'John Doe',
    phoneNumber: '9543260340',
    email: 'john@example.com',
    password: bcrypt.hashSync('123456', 10),
  }
]

export default users
