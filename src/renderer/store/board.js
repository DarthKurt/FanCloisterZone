const DEFAULT_ZOOM = 0.18

export const state = () => ({
  dragging: null,
  diceRollPanel: null,
  pointsExpression: null,
  returnedMeeplePanel: null,
  returnedTokenPanel: null,
  layers: {},
  tilePlacementMouseOver: null,
  zoom: DEFAULT_ZOOM,
  rotate: 0
})

export const mutations = {
  dragging (state, value) { state.dragging = value },
  diceRollPanel (state, value) { state.diceRollPanel = value },
  pointsExpression (state, value) { state.pointsExpression = value },
  returnedMeeplePanel (state, value) { state.returnedMeeplePanel = value },
  returnedTokenPanel (state, value) { state.returnedTokenPanel = value },

  showLayer (state, { layer, props }) {
    const { layers } = state
    if (!layers[layer]) {
      layers[layer] = props
    } else {
      Object.entries(props).forEach(([key, value]) => { layers[layer][key] = value })
      Object.keys(layers[layer]).forEach(key => { if (props[key] === undefined) delete layers[layer][key] })
    }
  },

  hideLayer (state, { layer }) { delete state.layers[layer] },
  tilePlacementMouseOver (state, value) { state.tilePlacementMouseOver = value },
  resetZoom (state) { state.zoom = DEFAULT_ZOOM },

  changeZoom (state, steps) {
    let zoom = state.zoom * (1.3 ** steps)
    if (zoom < 0.03) zoom = 0.03
    if (zoom > 0.4) zoom = 0.4
    state.zoom = zoom
  },

  changeRotate (state, rotate) { state.rotate = rotate },

  reset (state) {
    state.dragging = null
    state.pointsExpression = null
    state.returnedMeeplePanel = null
    state.returnedTokenPanel = null
    state.layers = {}
    state.tilePlacementMouseOver = null
    state.zoom = DEFAULT_ZOOM
    state.rotate = 0
  }
}

export const getters = {
  isDragging: state => evClick => {
    if (!state.dragging) return false
    const changeX = evClick.screenX - state.dragging.x
    const changeY = evClick.screenY - state.dragging.y
    return Math.abs(changeX) > 5 || Math.abs(changeY) > 5
  },

  bounds: (state, getters, rootState) => {
    const bx = [0, 0]
    const by = [0, 0]
    if (rootState.game.placedTiles) {
      rootState.game.placedTiles.forEach(({ position: [x, y] }) => {
        bx[0] = Math.min(bx[0], x)
        bx[1] = Math.max(bx[1], x)
        by[0] = Math.min(by[0], y)
        by[1] = Math.max(by[1], y)
      })
    }
    return { x: bx, y: by }
  }
}
