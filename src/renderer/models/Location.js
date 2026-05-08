const edgeInstances = Object.create(null)

export default class Location {
  constructor (name, mask = null) {
    if (mask != null && mask === 0) throw new Error('Empty mask is not allowed')
    this.mask = mask
    this.name = name

    if (!this.name) {
      const parts = []
      Location.FIELD_SIDES.forEach(side => {
        if (this.intersect(side)) parts.push(side.name)
      })
      this.name = parts.join('.')
    }

    Object.freeze(this)
    if (mask !== null) {
      if (edgeInstances[mask]) throw new Error('Duplicate Location')
      edgeInstances[mask] = this
    }
  }

  next () { return this.shift(2) }
  prev () { return this.shift(6) }

  rev () {
    let mLo = this.mask & 255
    mLo = ((mLo & 85) << 5) | ((mLo & 170) << 3)
    mLo = (mLo | (mLo >> 8)) & 255
    let mHi = (this.mask & 65280) >> 8
    mHi = ((mHi & 85) << 5) | ((mHi & 170) << 3)
    mHi = (mHi | (mHi >> 8)) & 255
    return Location.get((this.mask & ~65535) | (mHi << 8) | mLo)
  }

  shift (i) {
    let mLo = (this.mask & 255) << i
    mLo = (mLo | mLo >> 8) & 255
    let mHi = (this.mask & 65280) << i
    mHi = (mHi | mHi >> 8) & 65280
    return Location.get((this.mask & ~65535) | mHi | mLo)
  }

  rotateCCW (rotation) {
    if (this.mask === null) return this
    return this.shift(((rotation / 90) * 6) % 8)
  }

  rotateCW (rotation) {
    if (this.mask === null) return this
    return this.shift((rotation / 90) * 2)
  }

  getLeftFarm () { return Location.get((this.mask >> 8) & 85) }
  getRightFarm () { return Location.get((this.mask >> 8) & 170) }

  isPartOf (loc) {
    if (this.mask === 0) return this === loc
    return ((this.mask ^ loc.mask) & this.mask) === 0
  }

  union (loc) {
    if (!loc) return this
    return Location.get(this.mask | loc.mask)
  }

  subtract (loc) {
    return Location.get((~(this.mask & loc.mask)) & this.mask)
  }

  intersect (loc) {
    if (this === loc) return this
    if (!loc || this.mask === null || loc.mask === null || (this.mask & loc.mask) === 0) return null
    return Location.get(this.mask & loc.mask)
  }

  intersectMulti (locs) {
    const result = []
    locs.forEach(loc => { const item = this.intersect(loc); if (item) result.push(item) })
    return result
  }

  getRotationOf (loc) {
    return [0, 90, 180, 270].find(r => this.name === loc.rotateCW(r).name)
  }

  isRotationOf (loc) { return !!this.getRotationOf(loc) }
  isFieldLocation () { return ((this.mask & 0x30000) | (this.mask & 0xFF)) > 0 || this.mask === null }
  toString () { return this.name }

  static get (mask) {
    return edgeInstances[mask] || new Location(null, mask)
  }

  static parse (names) {
    let result = null
    names.trim().split(/[\.\s]+/).forEach(name => {
      const loc = name ? Location[name] : null
      if (loc) result = loc.union(result)
    })
    if (result === null) console.warn('Unmatched location ' + names)
    return result
  }
}

export const N = Location.N = new Location('N', 3 << 8)
export const W = Location.W = new Location('W', 192 << 8)
export const S = Location.S = new Location('S', 48 << 8)
export const E = Location.E = new Location('E', 12 << 8)
export const NW = Location.NW = new Location('NW', 195 << 8)
export const SW = Location.SW = new Location('SW', 240 << 8)
export const SE = Location.SE = new Location('SE', 60 << 8)
export const NE = Location.NE = new Location('NE', 15 << 8)
export const WE = Location.WE = new Location('WE', 204 << 8)
export const NS = Location.NS = new Location('NS', 51 << 8)
export const NWSE = Location.NWSE = new Location('NWSE', 255 << 8)
export const _N = Location._N = new Location('_N', 252 << 8)
export const _W = Location._W = new Location('_W', 63 << 8)
export const _S = Location._S = new Location('_S', 207 << 8)
export const _E = Location._E = new Location('_E', 243 << 8)
export const I = Location.I = new Location('I')
export const II = Location.II = new Location('II')
export const III = Location.III = new Location('III')
export const IV = Location.IV = new Location('IV')
export const AS_ABBOT = Location.AS_ABBOT = new Location('AS_ABBOT')
export const QUARTER_CASTLE = Location.QUARTER_CASTLE = new Location('QUARTER_CASTLE')
export const QUARTER_MARKET = Location.QUARTER_MARKET = new Location('QUARTER_MARKET')
export const QUARTER_BLACKSMITH = Location.QUARTER_BLACKSMITH = new Location('QUARTER_BLACKSMITH')
export const QUARTER_CATHEDRAL = Location.QUARTER_CATHEDRAL = new Location('QUARTER_CATHEDRAL')
export const NL = Location.NL = new Location('NL', 1)
export const NR = Location.NR = new Location('NR', 2)
export const EL = Location.EL = new Location('EL', 4)
export const ER = Location.ER = new Location('ER', 8)
export const SL = Location.SL = new Location('SL', 16)
export const SR = Location.SR = new Location('SR', 32)
export const WL = Location.WL = new Location('WL', 64)
