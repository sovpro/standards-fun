(() => {

document.documentElement.insertAdjacentHTML ('beforeend', `
    <template id="sovpro-slider">
        <style scoped>
            :host {
                box-sizing: border-box;
                border: 1px solid rgb(200, 200, 200);
                border-radius: 3px;
                display: block;
                height: 20px;
                margin: 1em 0;
                width: 220px;
            }
            :host(:focus) {
                box-shadow: 0px 0px 3px 1px rgb(86, 159, 255);
            }
            :host(:focus) #meter {
                opacity: 0.8;
            }
            #track {
                background-color: rgb(230, 230, 230);
                box-shadow: 0px 0px 2px 1px inset rgb(200, 200, 200);
                height: 100%;
                position: relative;
                width: 100%;
            }
            #handle, #handleShadow {
                background-color: white;
                border-color: rgb(220, 220, 220);
                border-style: solid;
                border-width: 0 3px 0 3px;
                box-sizing: border-box;
                cursor: pointer;
                height: 100%;
                left: 0%;
                position: absolute;
                top: 0;
                width: 12px;
            }
            #meter {
                background-color: yellow;
                height: 100%;
                opacity: 0.5;
                width: 0;
            }
        </style>
        <div id="track">
            <div id="handle">
            </div>
            <div id="meter">
            </div>
        </div>
    </template>
`)

// custom element definition and lifecycle implementation
customElements.define('sovpro-slider', class extends HTMLElement {
    constructor(...args) {
        super(...args)

        const template = document.getElementById('sovpro-slider')
        this.attachShadow({'mode':'open'})
        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this._root = null
        this._formerVal = this.value
        this._meter = this.shadowRoot.querySelector('#meter')
        this._track = this.shadowRoot.querySelector('#track')
        this._handle = this.shadowRoot.querySelector('#handle')

        this._handleShadow = this._handle.cloneNode(true)
        this._handleShadow.setAttribute('id', 'handleShadow')
        this._handleShadow.style.opacity = 0.8

        this._dragging = false
        this._captureKeys = false
        this._layerX = 0

        // bound element event handlers
        this.__focus = this.__focus.bind(this)
        this.__blur = this.__blur.bind(this)
        this.__click = this.__click.bind(this)
        this.__mousedown = this.__mousedown.bind(this)

        this.addEventListener('focus', this.__focus, false)
        this.addEventListener('blur', this.__blur, false)
        this._track.addEventListener('click', this.__click, false)
        this._handle.addEventListener('mousedown', this.__mousedown, false)

        // bound document event handlers
        this.__keydown = this.__keydown.bind(this)
        this.__mousemove = this.__mousemove.bind(this)
        this.__mouseleave = this.__mouseleave.bind(this)
        this.__mouseup = this.__mouseup.bind(this)
    }
    __focus(evt) {
        this._captureKeys = true
    }
    __blur(evt) {
        this._captureKeys = false
    }
    __click(evt) {
        this._move(evt)
    }
    __mousedown(evt) {
        this._dragging = true
        this._layerX = evt.layerX
        evt.preventDefault()
        this._handleShadow.style.left = this._handle.style.left
        this.focus()
        this._track.appendChild(this._handleShadow)
        this._root.classList.add('dragging')
    }
    __keydown(evt) {
        if (this._captureKeys === false) return
        if (evt.keyCode >= 37 && evt.keyCode <= 40) {
            evt.preventDefault()
            const value = this.value
            if (evt.keyCode === 37 || evt.keyCode === 40) 
                this.setAttribute('value', Math.max(0, value - 1))
            else 
                this.setAttribute('value', Math.min(100, value + 1))
        }
    }
    __mousemove(evt) {
        if (this._dragging) this._move(evt)
    }
    __mouseleave(evt) {
        this._finish(evt)
    }
    __mouseup(evt) {
        this._finish(evt)
    }
    _removeRootListeners() {
        this._root.removeEventListener('keydown', this.__keydown, true)
        this._root.removeEventListener('mousemove', this.__mousemove, false)
        this._root.removeEventListener('mouseleave', this.__mouseleave, false)
        this._root.removeEventListener('mouseup', this.__mouseup, false)
    }
    _addRootListeners() {
        this._root.addEventListener('keydown', this.__keydown, true)
        this._root.addEventListener('mousemove', this.__mousemove, false)
        this._root.addEventListener('mouseleave', this.__mouseleave, false)
        this._root.addEventListener('mouseup', this.__mouseup, false)
    }
    _position(value) {
        const maxX = 100 / this._track.offsetWidth * this._track.offsetWidth
        const h = this._handle.offsetWidth / this._track.offsetWidth * 100
        const left = parseInt(value) / 100 * maxX
        this._handle.style.left = Math.max(0, (left - h)) + '%'
        this._meter.style.width = Math.max(0, (left - h)) + '%'
    }
    _dispatch() {
        const value = this.value
        if (this._formerVal === value) return
        this._formerVal = value
        const evt = new Event('input', { bubbles: true, cancelable: true, passive: false })
        evt.value = value
        this.dispatchEvent(evt)
    } 
    _move(evt) {
        const [rect] = this._track.getClientRects()
        const minX = rect.left
        // TODO: incorporate device pixel ratio / zoom with layerX
        const maxX = rect.right - this._handle.offsetWidth // + this._layerX
        if (evt.pageX >= minX && evt.pageX <= maxX) {
            const x = (evt.pageX - minX) / (maxX - minX)
            const h = this._handle.offsetWidth / this._track.offsetWidth * 100
            this._handleShadow.style.left = Math.max(0, (x * 100 - h)) + '%'
            this.setAttribute('value', Math.round(100 * x))
            // TODO: throttle this...
            this._dispatch()
        }
    }
    _finish(evt) {
        if (this._dragging === false) return
        this._dragging = false
        this._handle.style.left = this._handleShadow.style.left
        this._meter.style.width = this._handle.style.left
        this._track.removeChild(this._handleShadow)
        this._root.classList.remove('dragging')
    }
    connectedCallback() {
        this._position(this._formerVal)
        this.tabIndex = 0
        this.setAttribute('role', 'slider')
        this.setAttribute('aria-role', 'slider')
        this.setAttribute('aria-valuemin', 1)
        this.setAttribute('aria-valuemax', 100)
        this.setAttribute('aria-valuenow', this._formerVal)

        this._root = this.ownerDocument.documentElement
        this._addRootListeners()
    }
    disconnectedCallback() {
        this._removeRootListeners()
        this._root = null
    }
    adoptedCallback() {
        this._removeRootListeners()
        this._root = this.ownerDocument.documentElement
        this._addRootListeners()
    }
    attributeChangedCallback(name, oldval, newval) {
        if (this._dragging === true) return
        this.setAttribute('aria-valuenow', newval)
        this._position(newval)
        this._dispatch()
    }
    static get observedAttributes() {
        return ['value']
    }
    get value() {
        return parseInt(this.getAttribute('value'))
    }
    set value(value) {
        this.setAttribute('value', value)
    }
})

}) ()
