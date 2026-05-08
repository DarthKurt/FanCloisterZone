import { Store } from 'vuex'

export interface CounterState {
    count: number
}

export interface RootState {
    counter: CounterState
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $store: Store<RootState>
    }
}