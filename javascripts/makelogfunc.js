/**
 * Utility for generating a function to
 * log text in the DOM.
 *
 * @param {object} [options] options object
 * @param {string} [options.position=beforeend] where to
 *     position the log relative to selector. One of beforebegin,
 *     afterbegin, beforeend, afterend.
 * @param {string} [options.selector=body] selector to
 *     position log element relative to.
 * @param {string} [options.from=end] where new lines
 *     should appear from in log. one of: start, end.
 * @param {number} [options.rotate=100] rotate out old
 *     lines after this number of logs. 0 disables.
 *
 * @example
 * const logToElem = makelogfunc ({
 *   position: 'beforeend',
 *   selector: '#log-elem',
 *   from: 'start',
 *   rotate: 10
 * })
 * logToElem ('Hello')
 * logToElem ('World')
 *
 * @returns {Function} DOM logging function
 */
const makelogfunc = (() => {
    // library function for all log funcs
    const makeline = (text) => {
        const line = document.createElement('li')
        line.appendChild(document.createTextNode(text))
        return line
    }
    return (config = {position: 'beforeend', selector: 'body', from: 'end', rotate: 100}) => {
        let _queue = []
        let _elem = undefined
        let _log = undefined
        const head = config.from === 'start'
        const log = (text) => {
            if (config.rotate > 0)
              while (_elem.childElementCount >= config.rotate)
                _elem.removeChild(head ? _elem.lastElementChild : _elem.firstElementChild)
            _elem.insertAdjacentElement(
                head ? 'afterbegin' : 'beforeend',
                makeline(text))
        }
        const loaded = () => {
            const position = config.position
            const selector = config.selector
            _elem = document.querySelector(selector).insertAdjacentElement(
                position, document.createElement('ol'))
            if (head) _elem.reversed = true
            let text = undefined
            console.log(_queue)
            while (text = _queue[head ? 'pop' : 'shift']()) log(text)
            _log = log
        }
        if (document.readyState !== 'complete') {
            document.addEventListener(
                'DOMContentLoaded', () => loaded(), { once: true })
            const _enqueue = (text) => {
                if (config.rotate > 0)
                  while (_queue.length >= config.rotate)
                    _queue[head ? 'pop' : 'shift']()
                _queue[head ? 'unshift' : 'push'](text)
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
