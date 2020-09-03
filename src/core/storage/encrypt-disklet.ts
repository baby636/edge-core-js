import { Disklet, DiskletListing } from 'disklet'
import { bridgifyObject } from 'yaob'

import { EdgeIo } from '../../types/types'
import { decrypt, decryptText, encrypt } from '../../util/crypto/crypto'
import { utf8 } from '../../util/encoding'

export function encryptDisklet(
  io: EdgeIo,
  dataKey: Uint8Array,
  disklet: Disklet
): Disklet {
  const out = {
    delete(path: string): Promise<unknown> {
      return disklet.delete(path)
    },

    getData(path: string): Promise<Uint8Array> {
      return disklet
        .getText(path)
        .then(text => JSON.parse(text))
        .then(json => decrypt(json, dataKey))
    },

    getText(path: string): Promise<string> {
      return disklet
        .getText(path)
        .then(text => JSON.parse(text))
        .then(json => decryptText(json, dataKey))
    },

    list(path?: string): Promise<DiskletListing> {
      return disklet.list(path)
    },

    setData(path: string, data: ArrayLike<number>): Promise<unknown> {
      const dataCast: any = data // Treating Array<number> like Uint8Array
      return disklet.setText(
        path,
        JSON.stringify(encrypt(io, dataCast, dataKey))
      )
    },

    setText(path: string, text: string): Promise<unknown> {
      return this.setData(path, utf8.parse(text))
    }
  }
  bridgifyObject(out)
  return out
}
