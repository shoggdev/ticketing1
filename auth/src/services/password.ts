import { scrypt, randomBytes} from 'crypto';
import { promisify } from 'util'

// scrypt is the hashing function but it is callback based
// we want to use async await inside the following class static methods.
// promisify can take a callback based scrypt and turn it into something compatible with async await
const scryptAsync = promisify(scrypt);

export class Password {
  static async toHash(password: string) {
    const salt = randomBytes(8).toString('hex');

    // The "as Buffer" tells typescript that buffer will be of type Buffer
    const buffer = (await scryptAsync(password, salt, 64)) as Buffer;

    // Add the salt to the hashed password for storage
    return `${buffer.toString('hex')}.${salt}`;
  }

  static async compare(storedPassword: string, suppliedPassword: string){
    // Separate the stored hashedPassword and salt
    const [hashedPassword, salt] = storedPassword.split('.');

    // The "as Buffer" tells typescript that buffer will be of type Buffer
    // Now hash the supplied password with the stored salt
    const buffer = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;

    // See if the hashed supplied password matches the hashed stored password
    return buffer.toString('hex') === hashedPassword;
  }
}