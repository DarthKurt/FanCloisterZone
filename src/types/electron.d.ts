export { }

declare global {
    interface Window {
        electronAPI: {
            getAppVersion: () => Promise<string>
            send: (channel: 'toMain', data: unknown) => void
            on: (channel: 'fromMain', callback: (...args: unknown[]) => void) => void
        }
    }
}