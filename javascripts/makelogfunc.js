// Utility for logging text in the DOM
// make log func for a given configuration
// {
//   [insertBefore | insertAfter | appendChild]: selector,
//   head: boolean,
//   roll: number
// }
const makelogfunc = (() => {
    // library function for all log funcs
    const makeline = (text) => {
        const line = document.createElement('li')
        line.appendChild(document.createTextNode(text))
        return line
    }
    return (config = {'beforeend':'body', 'head':false, 'roll':100}) => {
        let _queue = []
        let _elem = undefined
        let _log = undefined
        const log = (text) => {
            if (_elem.childElementCount === config.roll)
                _elem.removeChild(config.head ? _elem.lastElementChild : _elem.firstElementChild)
            _elem.insertAdjacentElement(
                config.head ? 'afterbegin' : 'beforeend',
                makeline(text))
        }
        const loaded = () => {
            const position = Object.getOwnPropertyNames(config).
                                    find(name => /^(before|after)(begin|end)$/.test(name))
            const selector = config[position]
            _elem = document.querySelector(selector).insertAdjacentElement(
                position, document.createElement('ol'))
            if (config.head) _elem.reversed = true
            let text = undefined
            console.log(_queue)
            while (text = _queue[config.head ? 'pop' : 'shift']()) log(text)
            _log = log
        }
        if (document.readyState !== 'complete') {
            document.addEventListener(
                'DOMContentLoaded', () => loaded(), { once: true })
            const _enqueue = (text) => {
                if (_queue.length === config.roll)
                    _queue[config.head ? 'pop' : 'shift']()
                _queue[config.head ? 'unshift' : 'push'](text)
            }
            _log = _enqueue
        }
        else loaded()
        // invoke log func indirectly to
        // support enqueueing logged text until
        // document is ready
        return (text) => _log(text)
    }
})()