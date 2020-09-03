import { EdgeWalletInfo, EdgeWalletInfoFull } from '../../types/types'
import { LoginStash } from './login-stash'

/**
 * Data sent to authenticate with the login server.
 */
export interface LoginRequest {
  // The request payload:
  data?: any

  // Common fields for all login methods:
  deviceDescription?: string
  otp?: string
  voucherId?: string
  voucherAuth?: string

  // Auth key login:
  loginId?: string
  loginAuth?: string

  // Password login:
  userId?: string
  passwordAuth?: string

  // PIN login:
  pin2Id?: string
  pin2Auth?: string

  // Recovery login:
  recovery2Id?: string
  recovery2Auth?: string[]
}

// Login data decrypted into memory.
export interface LoginTree {
  // Identity:
  appId: string
  created?: Date
  lastLogin: Date
  loginId: string
  loginKey: Uint8Array
  userId?: string
  username?: string

  // 2-factor:
  otpKey?: string
  otpResetDate?: Date
  otpTimeout?: number

  // Login methods:
  loginAuth?: Uint8Array
  passwordAuth?: Uint8Array
  pin?: string
  pin2Key?: Uint8Array
  recovery2Key?: Uint8Array

  // Resources:
  children: LoginTree[]
  keyInfos: EdgeWalletInfo[]
}

export interface AppIdMap {
  [walletId: string]: string[]
}

export interface LoginKit {
  loginId: string
  login: any
  server?: any
  serverMethod?: string
  serverPath: string
  stash: Partial<LoginStash>
}

export interface WalletInfoFullMap {
  [walletId: string]: EdgeWalletInfoFull
}
