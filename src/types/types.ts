import { Disklet } from 'disklet'
import { Subscriber } from 'yaob'

export {
  DustSpendError,
  errorNames,
  InsufficientFundsError,
  SpendToSelfError,
  NetworkError,
  NoAmountSpecifiedError,
  ObsoleteApiError,
  OtpError,
  PasswordError,
  PendingFundsError,
  SameCurrencyError,
  SwapAboveLimitError,
  SwapBelowLimitError,
  SwapCurrencyError,
  SwapPermissionError,
  UsernameError
} from './error'

// ---------------------------------------------------------------------
// helper types
// ---------------------------------------------------------------------

/** A JSON object (as opposed to an array or primitive). */
export interface JsonObject {
  [name: string]: any // TODO: this needs to become `unknown`
}

/** A collection of unknown extra methods exposed by a plugin. */
export interface EdgeOtherMethods {
  readonly [name: string]: any
}

/** We frequently index things by pluginId, so provide a helper. */
export interface EdgePluginMap<Value> {
  [pluginId: string]: Value
}

// ---------------------------------------------------------------------
// io types
// ---------------------------------------------------------------------

// Node.js randomBytes function:
export type EdgeRandomFunction = (bytes: number) => Uint8Array

// The scrypt function Edge expects:
export type EdgeScryptFunction = (
  data: Uint8Array,
  salt: Uint8Array,
  n: number,
  r: number,
  p: number,
  dklen: number
) => Promise<Uint8Array>

/**
 * The subset of the `fetch` options we guarantee to support.
 */
export interface EdgeFetchOptions {
  method?: string
  body?: ArrayBuffer | string
  headers?: { [header: string]: string }
}

/**
 * The subset of the `Headers` DOM object we guarantee to support.
 */
export interface EdgeFetchHeaders {
  forEach(
    callback: (value: string, name: string, self: EdgeFetchHeaders) => void,
    thisArg?: any
  ): void
  get(name: string): string | null
  has(name: string): boolean
}

/**
 * The subset of the `Response` DOM object we guarantee to support.
 */
export interface EdgeFetchResponse {
  readonly headers: EdgeFetchHeaders
  readonly ok: boolean
  readonly status: number
  arrayBuffer(): Promise<ArrayBuffer>
  json(): Promise<any>
  text(): Promise<string>
}

/**
 * The subset of the `fetch` DOM function we guarantee to support,
 * especially if we have to emulate `fetch` in weird environments.
 */
export type EdgeFetchFunction = (
  uri: string,
  opts?: EdgeFetchOptions
) => Promise<EdgeFetchResponse>

/**
 * Access to platform-specific resources.
 * The core never talks to the outside world on its own,
 * but always goes through this object.
 */
export interface EdgeIo {
  // Crypto:
  readonly random: EdgeRandomFunction
  readonly scrypt: EdgeScryptFunction

  // Local io:
  readonly disklet: Disklet
  readonly fetch: EdgeFetchFunction

  // This is only present if the platform has some way to avoid CORS:
  readonly fetchCors?: EdgeFetchFunction

  // Deprecated:
  // eslint-disable-next-line no-use-before-define
  readonly console: EdgeConsole
}

// logging -------------------------------------------------------------

export type EdgeLogMethod = (...args: any[]) => void

/**
 * Logs a message. Call `log(message)` for normal information messages,
 * or `log.warn(message)` / `log.error(message)` for something more severe.
 */
export type EdgeLog = EdgeLogMethod & {
  readonly warn: EdgeLogMethod
  readonly error: EdgeLogMethod
}

/**
 * The EdgeLog function stringifies its arguments and adds
 * some extra information to form this event type.
 */
export interface EdgeLogEvent {
  message: string
  source: string
  time: Date
  type: 'info' | 'warn' | 'error'
}

export type EdgeOnLog = (event: EdgeLogEvent) => void

// plugins -------------------------------------------------------------

/**
 * On React Native, each plugin can provide a bridge to whatever native
 * io it needs.
 */
export interface EdgeNativeIo {
  [packageName: string]: EdgeOtherMethods
}

/**
 * All core plugins receive these options at creation time.
 */
export interface EdgeCorePluginOptions {
  // Load-time options (like API keys) passed into the context:
  initOptions: JsonObject

  // Access to the world outside the plugin:
  io: EdgeIo
  log: EdgeLog // Plugin-scoped logging
  nativeIo: EdgeNativeIo // Only filled in on React Native
  pluginDisklet: Disklet // Plugin-scoped local storage
}

// ---------------------------------------------------------------------
// key types
// ---------------------------------------------------------------------

export interface EdgeWalletInfo {
  id: string
  type: string
  keys: JsonObject
}

export type EdgeWalletInfoFull = EdgeWalletInfo & {
  appIds: string[]
  archived: boolean
  deleted: boolean
  hidden: boolean
  sortIndex: number
}

export interface EdgeWalletState {
  archived?: boolean
  deleted?: boolean
  hidden?: boolean
  sortIndex?: number
}

export interface EdgeWalletStates {
  [walletId: string]: EdgeWalletState
}

// ---------------------------------------------------------------------
// currency types
// ---------------------------------------------------------------------

// currency info -------------------------------------------------------

export interface EdgeDenomination {
  name: string
  multiplier: string
  symbol?: string
}

export interface EdgeMetaToken {
  currencyCode: string
  currencyName: string
  denominations: EdgeDenomination[]
  contractAddress?: string
  symbolImage?: string
}

type EdgeObjectTemplate = Array<
  | {
      type: 'nativeAmount'
      key: string
      displayName: string
      displayMultiplier: string
    }
  | {
      type: 'number'
      key: string
      displayName: string
    }
  | {
      type: 'string'
      key: string
      displayName: string
    }
>

export interface EdgeCurrencyInfo {
  // Basic currency information:
  readonly pluginId: string
  displayName: string
  walletType: string

  // Native token information:
  currencyCode: string
  denominations: EdgeDenomination[]

  // Chain information:
  canAdjustFees?: boolean // Defaults to true
  canImportKeys?: boolean // Defaults to false
  customFeeTemplate?: EdgeObjectTemplate // Indicates custom fee support
  customTokenTemplate?: EdgeObjectTemplate // Indicates custom token support
  requiredConfirmations?: number

  // Configuration options:
  defaultSettings: JsonObject
  metaTokens: EdgeMetaToken[]

  // Explorers:
  addressExplorer: string
  blockExplorer?: string
  transactionExplorer: string
  xpubExplorer?: string

  // Images:
  symbolImage?: string
  symbolImageDarkMono?: string
}

// spending ------------------------------------------------------------

export interface EdgeMetadata {
  bizId?: number
  category?: string
  exchangeAmount?: { [fiatCurrencyCode: string]: number }
  name?: string
  notes?: string

  // Deprecated. Use exchangeAmount instead:
  amountFiat?: number

  // Deprecated. The core has never actually written this to disk,
  // but deleting this definition would break the GUI:
  miscJson?: string
}

export interface EdgeNetworkFee {
  readonly currencyCode: string
  readonly nativeAmount: string
}

export interface EdgeTxSwap {
  orderId?: string
  orderUri?: string
  isEstimate: boolean

  // The EdgeSwapInfo from the swap plugin:
  plugin: {
    pluginId: string
    displayName: string
    supportEmail?: string
  }

  // Address information:
  payoutAddress: string
  payoutCurrencyCode: string
  payoutNativeAmount: string
  payoutWalletId: string
  refundAddress?: string
}

export interface EdgeTransaction {
  // Amounts:
  currencyCode: string
  nativeAmount: string

  // Fees:
  networkFee: string
  parentNetworkFee?: string

  // Confirmation status:
  blockHeight: number
  date: number

  // Transaction info:
  txid: string
  signedTx: string
  ourReceiveAddresses: string[]

  // Spend-specific metadata:
  networkFeeOption?: 'high' | 'standard' | 'low' | 'custom'
  requestedCustomFee?: JsonObject
  feeRateUsed?: JsonObject
  spendTargets?: Array<{
    readonly currencyCode: string
    readonly nativeAmount: string
    readonly publicAddress: string
    readonly uniqueIdentifier?: string
  }>
  swapData?: EdgeTxSwap
  txSecret?: string // Monero decryption key

  // Core:
  metadata?: EdgeMetadata
  wallet?: EdgeCurrencyWallet // eslint-disable-line no-use-before-define
  otherParams?: JsonObject
}

export interface EdgeSpendTarget {
  nativeAmount?: string
  publicAddress?: string
  uniqueIdentifier?: string
  otherParams?: JsonObject
}

export interface EdgePaymentProtocolInfo {
  domain: string
  memo: string
  merchant: string
  nativeAmount: string
  spendTargets: EdgeSpendTarget[]
}

export interface EdgeSpendInfo {
  // Basic information:
  currencyCode?: string
  privateKeys?: string[]
  spendTargets: EdgeSpendTarget[]

  // Options:
  noUnconfirmed?: boolean
  networkFeeOption?: 'high' | 'standard' | 'low' | 'custom'
  customNetworkFee?: JsonObject // Some kind of currency-specific JSON

  // Core:
  metadata?: EdgeMetadata
  swapData?: EdgeTxSwap
  otherParams?: JsonObject
}

// query data ----------------------------------------------------------

export interface EdgeDataDump {
  walletId: string
  walletType: string
  data: {
    [dataCache: string]: JsonObject
  }
}

export interface EdgeFreshAddress {
  publicAddress: string
  segwitAddress?: string
  legacyAddress?: string
}

export interface EdgeTokenInfo {
  currencyCode: string
  currencyName: string
  contractAddress: string
  multiplier: string
}

export interface EdgeTxidMap {
  [txid: string]: number
}

// URI -----------------------------------------------------------------

export interface EdgeParsedUri {
  token?: EdgeMetaToken
  privateKeys?: string[]
  publicAddress?: string
  legacyAddress?: string
  segwitAddress?: string
  nativeAmount?: string
  currencyCode?: string
  metadata?: EdgeMetadata
  bitIDURI?: string
  bitIDDomain?: string
  bitIDCallbackUri?: string
  paymentProtocolUrl?: string
  returnUri?: string
  uniqueIdentifier?: string // Ripple payment id
  bitidPaymentAddress?: string // Experimental
  bitidKycProvider?: string // Experimental
  bitidKycRequest?: string // Experimental
}

export interface EdgeEncodeUri {
  publicAddress: string
  segwitAddress?: string
  legacyAddress?: string
  nativeAmount?: string
  label?: string
  message?: string
  currencyCode?: string
}

// options -------------------------------------------------------------

export interface EdgeCurrencyCodeOptions {
  currencyCode?: string
}

export interface EdgeGetTransactionsOptions {
  currencyCode?: string
  startIndex?: number
  startEntries?: number
  startDate?: Date
  endDate?: Date
  searchString?: string
  returnIndex?: number
  returnEntries?: number
  denomination?: string
}

// engine --------------------------------------------------------------

export interface EdgeCurrencyEngineCallbacks {
  readonly onBlockHeightChanged: (blockHeight: number) => void
  readonly onTransactionsChanged: (transactions: EdgeTransaction[]) => void
  readonly onBalanceChanged: (
    currencyCode: string,
    nativeBalance: string
  ) => void
  readonly onAddressesChecked: (progressRatio: number) => void
  readonly onTxidsChanged: (txids: EdgeTxidMap) => void
}

export interface EdgeCurrencyEngineOptions {
  callbacks: EdgeCurrencyEngineCallbacks
  log: EdgeLog // Wallet-scoped logging
  walletLocalDisklet: Disklet
  walletLocalEncryptedDisklet: Disklet
  userSettings: JsonObject | undefined
}

export interface EdgeCurrencyEngine {
  changeUserSettings(settings: JsonObject): Promise<unknown>

  // Keys:
  getDisplayPrivateSeed(): string | null
  getDisplayPublicSeed(): string | null

  // Engine status:
  startEngine(): Promise<unknown>
  killEngine(): Promise<unknown>
  resyncBlockchain(): Promise<unknown>
  dumpData(): EdgeDataDump

  // Chain state:
  getBlockHeight(): number
  getBalance(opts: EdgeCurrencyCodeOptions): string
  getNumTransactions(opts: EdgeCurrencyCodeOptions): number
  getTransactions(opts: EdgeGetTransactionsOptions): Promise<EdgeTransaction[]>
  getTxids?: () => EdgeTxidMap

  // Tokens:
  enableTokens(tokens: string[]): Promise<unknown>
  disableTokens(tokens: string[]): Promise<unknown>
  getEnabledTokens(): Promise<string[]>
  addCustomToken(token: EdgeTokenInfo): Promise<unknown>
  getTokenStatus(token: string): boolean

  // Addresses:
  getFreshAddress(opts: EdgeCurrencyCodeOptions): EdgeFreshAddress
  addGapLimitAddresses(addresses: string[]): void
  isAddressUsed(address: string): boolean

  // Spending:
  makeSpend(spendInfo: EdgeSpendInfo): Promise<EdgeTransaction>
  signTx(transaction: EdgeTransaction): Promise<EdgeTransaction>
  broadcastTx(transaction: EdgeTransaction): Promise<EdgeTransaction>
  saveTx(transaction: EdgeTransaction): Promise<unknown>
  readonly sweepPrivateKeys?: (
    spendInfo: EdgeSpendInfo
  ) => Promise<EdgeTransaction>
  readonly getPaymentProtocolInfo?: (
    paymentProtocolUrl: string
  ) => Promise<EdgePaymentProtocolInfo>

  // Escape hatch:
  readonly otherMethods?: EdgeOtherMethods
}

// currency plugin -----------------------------------------------------

export interface EdgeCurrencyTools {
  // Keys:
  readonly importPrivateKey?: (
    key: string,
    opts?: JsonObject
  ) => Promise<JsonObject>
  createPrivateKey(walletType: string, opts?: JsonObject): Promise<JsonObject>
  derivePublicKey(walletInfo: EdgeWalletInfo): Promise<JsonObject>
  readonly getSplittableTypes?: (walletInfo: EdgeWalletInfo) => string[]

  // URIs:
  parseUri(
    uri: string,
    currencyCode?: string,
    customTokens?: EdgeMetaToken[]
  ): Promise<EdgeParsedUri>
  encodeUri(obj: EdgeEncodeUri, customTokens?: EdgeMetaToken[]): Promise<string>
}

export interface EdgeCurrencyPlugin {
  readonly currencyInfo: EdgeCurrencyInfo

  makeCurrencyTools(): Promise<EdgeCurrencyTools>
  makeCurrencyEngine(
    walletInfo: EdgeWalletInfo,
    opts: EdgeCurrencyEngineOptions
  ): Promise<EdgeCurrencyEngine>

  // Escape hatch:
  readonly otherMethods?: EdgeOtherMethods
}

// wallet --------------------------------------------------------------

export interface EdgeBalances {
  [currencyCode: string]: string
}

export type EdgeReceiveAddress = EdgeFreshAddress & {
  metadata: EdgeMetadata
  nativeAmount: string
}

export interface EdgeCurrencyWalletEvents {
  close: void
  newTransactions: EdgeTransaction[]
  transactionsChanged: EdgeTransaction[]
}

export interface EdgeCurrencyWallet {
  readonly on: Subscriber<EdgeCurrencyWalletEvents>
  readonly watch: Subscriber<EdgeCurrencyWallet>

  // Data store:
  readonly id: string
  readonly keys: JsonObject
  readonly type: string
  readonly publicWalletInfo: EdgeWalletInfo
  readonly disklet: Disklet
  readonly localDisklet: Disklet
  sync(): Promise<void>

  // Wallet keys:
  readonly displayPrivateSeed: string | null
  readonly displayPublicSeed: string | null

  // Wallet name:
  readonly name: string | null
  renameWallet(name: string): Promise<void>

  // Fiat currency option:
  readonly fiatCurrencyCode: string
  setFiatCurrencyCode(fiatCurrencyCode: string): Promise<void>

  // Currency info:
  readonly currencyInfo: EdgeCurrencyInfo
  nativeToDenomination(
    nativeAmount: string,
    currencyCode: string
  ): Promise<string>
  denominationToNative(
    denominatedAmount: string,
    currencyCode: string
  ): Promise<string>

  // Chain state:
  readonly balances: EdgeBalances
  readonly blockHeight: number
  readonly syncRatio: number

  // Running state:
  startEngine(): Promise<void>
  stopEngine(): Promise<void>

  // Token management:
  changeEnabledTokens(currencyCodes: string[]): Promise<void>
  enableTokens(tokens: string[]): Promise<void>
  disableTokens(tokens: string[]): Promise<void>
  getEnabledTokens(): Promise<string[]>
  addCustomToken(token: EdgeTokenInfo): Promise<void>

  // Transaction history:
  getNumTransactions(opts?: EdgeCurrencyCodeOptions): Promise<number>
  getTransactions(opts?: EdgeGetTransactionsOptions): Promise<EdgeTransaction[]>

  // Addresses:
  getReceiveAddress(opts?: EdgeCurrencyCodeOptions): Promise<EdgeReceiveAddress>
  saveReceiveAddress(receiveAddress: EdgeReceiveAddress): Promise<void>
  lockReceiveAddress(receiveAddress: EdgeReceiveAddress): Promise<void>

  // Sending:
  makeSpend(spendInfo: EdgeSpendInfo): Promise<EdgeTransaction>
  signTx(tx: EdgeTransaction): Promise<EdgeTransaction>
  broadcastTx(tx: EdgeTransaction): Promise<EdgeTransaction>
  saveTx(tx: EdgeTransaction): Promise<void>
  sweepPrivateKeys(edgeSpendInfo: EdgeSpendInfo): Promise<EdgeTransaction>
  saveTxMetadata(
    txid: string,
    currencyCode: string,
    metadata: EdgeMetadata
  ): Promise<void>
  getMaxSpendable(spendInfo: EdgeSpendInfo): Promise<string>
  getPaymentProtocolInfo(
    paymentProtocolUrl: string
  ): Promise<EdgePaymentProtocolInfo>

  // Wallet management:
  resyncBlockchain(): Promise<void>
  dumpData(): Promise<EdgeDataDump>
  getDisplayPrivateSeed(): string | null
  getDisplayPublicSeed(): string | null

  // Data exports:
  exportTransactionsToQBO(opts: EdgeGetTransactionsOptions): Promise<string>
  exportTransactionsToCSV(opts: EdgeGetTransactionsOptions): Promise<string>

  // URI handling:
  parseUri(uri: string, currencyCode?: string): Promise<EdgeParsedUri>
  encodeUri(obj: EdgeEncodeUri): Promise<string>

  readonly otherMethods: EdgeOtherMethods

  // Deprecated API's:
  getBalance(opts?: EdgeCurrencyCodeOptions): string
  getBlockHeight(): number
}

// ---------------------------------------------------------------------
// swap plugin
// ---------------------------------------------------------------------

/**
 * Static data about a swap plugin.
 */
export interface EdgeSwapInfo {
  readonly pluginId: string
  readonly displayName: string

  readonly orderUri?: string // The orderId would be appended to this
  readonly supportEmail: string
}

export interface EdgeSwapRequest {
  // Where?
  fromWallet: EdgeCurrencyWallet
  toWallet: EdgeCurrencyWallet

  // What?
  fromCurrencyCode: string
  toCurrencyCode: string

  // How much?
  nativeAmount: string
  quoteFor: 'from' | 'to'
}

/**
 * If the user approves a quote, the plugin performs the transaction
 * and returns this as the result.
 */
export interface EdgeSwapResult {
  readonly orderId?: string
  readonly destinationAddress?: string
  readonly transaction: EdgeTransaction
}

/**
 * If a provider can satisfy a request, what is their price?
 */
export interface EdgeSwapQuote {
  readonly isEstimate: boolean
  readonly fromNativeAmount: string
  readonly toNativeAmount: string
  readonly networkFee: EdgeNetworkFee

  readonly pluginId: string
  readonly expirationDate?: Date

  approve(): Promise<EdgeSwapResult>
  close(): Promise<void>
}

export interface EdgeSwapPluginStatus {
  needsActivation?: boolean
}

export interface EdgeSwapPlugin {
  readonly swapInfo: EdgeSwapInfo

  checkSettings?: (userSettings: JsonObject) => EdgeSwapPluginStatus
  fetchSwapQuote(
    request: EdgeSwapRequest,
    userSettings: JsonObject | undefined,
    opts: { promoCode?: string }
  ): Promise<EdgeSwapQuote>
}

// ---------------------------------------------------------------------
// rate plugin
// ---------------------------------------------------------------------

export interface EdgeRateHint {
  fromCurrency: string
  toCurrency: string
}

export interface EdgeRateInfo {
  readonly pluginId: string
  readonly displayName: string
}

export interface EdgeRatePair {
  fromCurrency: string
  toCurrency: string
  rate: number
}

export interface EdgeRatePlugin {
  readonly rateInfo: EdgeRateInfo

  fetchRates(hints: EdgeRateHint[]): Promise<EdgeRatePair[]>
}

// ---------------------------------------------------------------------
// account
// ---------------------------------------------------------------------

export interface EdgeAccountOptions {
  now?: Date // The current time, if different from `new Date()`
  otpKey?: string // The OTP secret
  otp?: string // The 6-digit OTP, or (deprecated) the OTP secret
}

// currencies ----------------------------------------------------------

export interface EdgeCreateCurrencyWalletOptions {
  fiatCurrencyCode?: string
  name?: string

  // Create a private key from some text:
  importText?: string

  // Used to tell the currency plugin what keys to create:
  keyOptions?: JsonObject

  // Used to copy wallet keys between accounts:
  keys?: JsonObject
}

export interface EdgeCurrencyConfig {
  readonly watch: Subscriber<EdgeCurrencyConfig>

  readonly currencyInfo: EdgeCurrencyInfo
  readonly otherMethods: EdgeOtherMethods
  readonly userSettings: JsonObject | undefined

  changeUserSettings(settings: JsonObject): Promise<void>
  importKey(userInput: string): Promise<JsonObject>
}

export interface EthereumTransaction {
  chainId: number // Not part of raw data, but needed for signing
  nonce: string
  gasPrice: string
  gasLimit: string
  to: string
  value: string
  data: string
  // The transaction is unsigned, so these are not present:
  v?: string
  r?: string
  s?: string
}

// rates ---------------------------------------------------------------

export interface EdgeRateCacheEvents {
  close: void
  update: unknown
}

export interface EdgeConvertCurrencyOpts {
  biases?: { [name: string]: number }
}

export interface EdgeRateCache {
  readonly on: Subscriber<EdgeRateCacheEvents>

  convertCurrency(
    fromCurrency: string,
    toCurrency: string,
    amount?: number,
    opts?: EdgeConvertCurrencyOpts
  ): Promise<number>
}

// swap ----------------------------------------------------------------

/**
 * Information and settings for a currency swap plugin.
 */
export interface EdgeSwapConfig {
  readonly watch: Subscriber<EdgeSwapConfig>

  readonly enabled: boolean
  readonly needsActivation: boolean
  readonly swapInfo: EdgeSwapInfo
  readonly userSettings: JsonObject | undefined

  changeEnabled(enabled: boolean): Promise<void>
  changeUserSettings(settings: JsonObject): Promise<void>
}

export interface EdgeSwapRequestOptions {
  preferPluginId?: string
  disabled?: EdgePluginMap<true>
  promoCodes?: EdgePluginMap<string>
}

// edge login ----------------------------------------------------------

export interface EdgeLoginRequest {
  readonly appId: string
  approve(): Promise<void>

  readonly displayName: string
  readonly displayImageUrl: string | undefined
}

export interface EdgeLobby {
  readonly loginRequest: EdgeLoginRequest | undefined
  // walletRequest: EdgeWalletRequest | undefined
}

// storage -------------------------------------------------------------

export interface EdgeDataStore {
  deleteItem(storeId: string, itemId: string): Promise<void>
  deleteStore(storeId: string): Promise<void>

  listItemIds(storeId: string): Promise<string[]>
  listStoreIds(): Promise<string[]>

  getItem(storeId: string, itemId: string): Promise<string>
  setItem(storeId: string, itemId: string, value: string): Promise<void>
}

// account -------------------------------------------------------------

export interface EdgeAccountEvents {
  close: void
}

export interface EdgeAccount {
  readonly on: Subscriber<EdgeAccountEvents>
  readonly watch: Subscriber<EdgeAccount>

  // Data store:
  readonly id: string
  readonly keys: JsonObject
  readonly type: string
  readonly disklet: Disklet
  readonly localDisklet: Disklet
  sync(): Promise<void>

  // Basic login information:
  readonly appId: string
  readonly created: Date | undefined // Not always known
  readonly lastLogin: Date
  readonly loggedIn: boolean
  readonly loginKey: string
  readonly recoveryKey: string | undefined // For email backup
  readonly rootLoginId: string
  readonly username: string

  // Special-purpose API's:
  readonly currencyConfig: EdgePluginMap<EdgeCurrencyConfig>
  readonly rateCache: EdgeRateCache
  readonly swapConfig: EdgePluginMap<EdgeSwapConfig>
  readonly dataStore: EdgeDataStore

  // What login method was used?
  readonly edgeLogin: boolean
  readonly keyLogin: boolean
  readonly newAccount: boolean
  readonly passwordLogin: boolean
  readonly pinLogin: boolean
  readonly recoveryLogin: boolean

  // Change or create credentials:
  changePassword(password: string): Promise<void>
  changePin(opts: {
    pin?: string // We keep the existing PIN if unspecified
    enableLogin?: boolean // We default to true if unspecified
  }): Promise<string>
  changeRecovery(questions: string[], answers: string[]): Promise<string>

  // Verify existing credentials:
  checkPassword(password: string): Promise<boolean>
  checkPin(pin: string): Promise<boolean>

  // Remove credentials:
  deletePassword(): Promise<void>
  deletePin(): Promise<void>
  deleteRecovery(): Promise<void>

  // OTP:
  readonly otpKey: string | undefined // OTP is enabled if this exists
  readonly otpResetDate: string | undefined // A reset is requested if this exists
  cancelOtpReset(): Promise<void>
  disableOtp(): Promise<void>
  enableOtp(timeout?: number): Promise<void>

  // 2fa bypass voucher approval / rejection:
  approveVoucher(voucherId: string): Promise<void>
  rejectVoucher(voucherId: string): Promise<void>

  // Edge login approval:
  fetchLobby(lobbyId: string): Promise<EdgeLobby>

  // Login management:
  logout(): Promise<void>

  // Master wallet list:
  readonly allKeys: EdgeWalletInfoFull[]
  changeWalletStates(walletStates: EdgeWalletStates): Promise<void>
  createWallet(type: string, keys?: JsonObject): Promise<string>
  getFirstWalletInfo(type: string): EdgeWalletInfo | undefined
  getWalletInfo(id: string): EdgeWalletInfo | undefined
  listWalletIds(): string[]
  listSplittableWalletTypes(walletId: string): Promise<string[]>
  splitWalletInfo(walletId: string, newWalletType: string): Promise<string>

  // Currency wallets:
  readonly activeWalletIds: string[]
  readonly archivedWalletIds: string[]
  readonly hiddenWalletIds: string[]
  readonly currencyWallets: { [walletId: string]: EdgeCurrencyWallet }
  createCurrencyWallet(
    type: string,
    opts?: EdgeCreateCurrencyWalletOptions
  ): Promise<EdgeCurrencyWallet>
  waitForCurrencyWallet(walletId: string): Promise<EdgeCurrencyWallet>

  // Web compatibility:
  signEthereumTransaction(
    walletId: string,
    transaction: EthereumTransaction
  ): Promise<string>

  // Swapping:
  fetchSwapQuote(
    request: EdgeSwapRequest,
    opts?: EdgeSwapRequestOptions
  ): Promise<EdgeSwapQuote>

  // Deprecated names:
  readonly exchangeCache: EdgeRateCache
}

// ---------------------------------------------------------------------
// context types
// ---------------------------------------------------------------------

export type EdgeCorePlugin =
  | EdgeCurrencyPlugin
  | EdgeRatePlugin
  | EdgeSwapPlugin

type EdgeCorePluginFactory = (env: EdgeCorePluginOptions) => EdgeCorePlugin

export type EdgeCorePlugins = EdgePluginMap<
  EdgeCorePlugin | EdgeCorePluginFactory
>

export type EdgeCorePluginsInit = EdgePluginMap<boolean | JsonObject>

export interface EdgeContextOptions {
  apiKey: string
  appId: string
  authServer?: string
  hideKeys?: boolean

  // A string to describe this phone or app:
  deviceDescription?: string

  // Intercepts all console logging:
  onLog?: EdgeOnLog

  path?: string // Only used on node.js
  plugins?: EdgeCorePluginsInit
}

// parameters ----------------------------------------------------------

export type EdgeEdgeLoginOptions = EdgeAccountOptions & {
  // Deprecated. The info server handles these now:
  displayImageUrl?: string
  displayName?: string
}

export interface EdgePendingVoucher {
  voucherId: string
  activates: Date
  created: Date
  deviceDescription?: string
  ip: string
  ipDescription: string
}

export interface EdgeLoginMessage {
  loginId: string
  otpResetPending: boolean
  pendingVouchers: EdgePendingVoucher[]
  recovery2Corrupt: boolean
}

export interface EdgeLoginMessages {
  [username: string]: EdgeLoginMessage
}

export interface EdgePasswordRules {
  secondsToCrack: number
  tooShort: boolean
  noNumber: boolean
  noLowerCase: boolean
  noUpperCase: boolean
  passed: boolean
}

export interface EdgePendingEdgeLogin {
  readonly id: string
  cancelRequest(): void
}

export interface EdgeUserInfo {
  keyLoginEnabled: boolean
  lastLogin?: Date
  pinLoginEnabled: boolean
  recovery2Key?: string
  username: string
}

// context -------------------------------------------------------------

export interface EdgeContextEvents {
  close: void
  error: Error
  login: EdgeAccount
  loginStart: { username: string }
  loginError: { error: Error }
}

export interface EdgeContext {
  readonly on: Subscriber<EdgeContextEvents>
  readonly watch: Subscriber<EdgeContext>
  close(): Promise<void>

  readonly appId: string

  // Local user management:
  localUsers: EdgeUserInfo[]
  fixUsername(username: string): string
  listUsernames(): Promise<string[]>
  deleteLocalAccount(username: string): Promise<void>

  // Account creation:
  usernameAvailable(username: string): Promise<boolean>
  createAccount(
    username: string,
    password?: string,
    pin?: string,
    opts?: EdgeAccountOptions
  ): Promise<EdgeAccount>

  // Edge login:
  requestEdgeLogin(opts?: EdgeEdgeLoginOptions): Promise<EdgePendingEdgeLogin>

  // Fingerprint login:
  loginWithKey(
    username: string,
    loginKey: string,
    opts?: EdgeAccountOptions
  ): Promise<EdgeAccount>

  // Password login:
  checkPasswordRules(password: string): EdgePasswordRules
  loginWithPassword(
    username: string,
    password: string,
    opts?: EdgeAccountOptions
  ): Promise<EdgeAccount>

  // PIN login:
  pinLoginEnabled(username: string): Promise<boolean>
  loginWithPIN(
    username: string,
    pin: string,
    opts?: EdgeAccountOptions
  ): Promise<EdgeAccount>

  // Recovery2 login:
  getRecovery2Key(username: string): Promise<string>
  loginWithRecovery2(
    recovery2Key: string,
    username: string,
    answers: string[],
    opts?: EdgeAccountOptions
  ): Promise<EdgeAccount>
  fetchRecovery2Questions(
    recovery2Key: string,
    username: string
  ): Promise<string[]>
  listRecoveryQuestionChoices(): Promise<string[]>

  // OTP stuff:
  requestOtpReset(username: string, otpResetToken: string): Promise<Date>
  fetchLoginMessages(): Promise<EdgeLoginMessages>

  // Background mode:
  readonly paused: boolean
  changePaused(paused: boolean, opts?: { secondsDelay?: number }): Promise<void>

  // Deprecated API's:
  pinExists(username: string): Promise<boolean>
}

// ---------------------------------------------------------------------
// fake mode
// ---------------------------------------------------------------------

export interface EdgeFakeWorldOptions {
  onLog?: EdgeOnLog
}

export interface EdgeFakeUser {
  username: string
  lastLogin?: Date
  loginId: string
  loginKey: string
  repos: { [repo: string]: { [path: string]: any /* EdgeBox */ } }
  server: any /* DbLogin & { children?: DbLogin[] } */
}

export interface EdgeFakeWorld {
  close(): Promise<void>

  makeEdgeContext(
    opts: EdgeContextOptions & { cleanDevice?: boolean }
  ): Promise<EdgeContext>

  goOffline(offline?: boolean): Promise<void>
  dumpFakeUser(account: EdgeAccount): Promise<EdgeFakeUser>
}

// ---------------------------------------------------------------------
// deprecated types
// ---------------------------------------------------------------------

// The only subset of `Console` that Edge core uses:
export interface EdgeConsole {
  error(...data: any[]): void
  info(...data: any[]): void
  warn(...data: any[]): void
}

export interface EdgeBitcoinPrivateKeyOptions {
  format?: string
  coinType?: number
  account?: number
}

export type EdgeCreatePrivateKeyOptions =
  | EdgeBitcoinPrivateKeyOptions
  | JsonObject
