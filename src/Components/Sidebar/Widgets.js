import Sidebar from '../Sidebar';
import dragula from 'dragula';
import emitter from '../../EE';

export default class Widgets extends Sidebar {
    static title = 'Widgets';
    static icon = 'television';
    static expandable = true;

    init() {
        this.drake = null;
    }
    
    click() {
        const content = document.createElement('div');
        content.classList.add('fred--thumbs', 'source');
        
        content.innerHTML = '<figure class="fred--thumb">\n' +
            '                            <div><img src="layouts/full-width.svg" alt=""></div>\n' +
            '                            <figcaption>\n' +
            '                                <strong>Full Width</strong>\n' +
            '                            </figcaption>\n' +
            '                            <div class="chunk" hidden="hidden">\n' +
            '                                <h2>Header #2</h2>\n' +
            '                                <p>Description</p>\n' +
            '                            </div>\n' +
            '                        </figure>\n' +
            '                        <figure class="fred--thumb">\n' +
            '                            <div><img src="layouts/right-panel-layout.svg" alt=""></div>\n' +
            '                            <figcaption>\n' +
            '                                <strong>2 Column</strong>\n' +
            '                                <em>Content Left. Component Right.</em>\n' +
            '                            </figcaption>\n' +
            '                            <div class="chunk" hidden="hidden">\n' +
            '                                <h3>Header #3</h3>\n' +
            '                                <img src="http://via.placeholder.com/350x150" />\n' +
            '                                <p>Description</p>\n' +
            '                            </div>\n' +
            '                        </figure>\n' +
            '                        <figure class="fred--thumb">\n' +
            '                            <div><img src="layouts/four-grid.svg" alt=""></div>\n' +
            '                            <figcaption>\n' +
            '                                <strong>Grid</strong>\n' +
            '                            </figcaption>\n' +
            '                            <div class="chunk" hidden="hidden">\n' +
            '                                <p>Description Only</p>\n' +
            '                            </div>\n' +
            '                        </figure>';
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(content.outerHTML);
            }, 500);
        })
    }

    afterExpand() {
        if (this.drake === null) {
            this.drake = dragula([document.querySelector('.source'), document.querySelector('.content')], {
                copy: function (el, source) {
                    return source === document.getElementsByClassName('source')[0]
                },
                accepts: function (el, target) {
                    return target !== document.getElementsByClassName('source')[0]
                },
                moves: function (el, source, handle, sibling) {
                    if (source.id === 'content') {
                        return handle.classList.contains('handle');
                    }
    
                    return true;
                }
            });

            this.drake.on('drop', (el, target, source, sibling) => {
                if (source.classList.contains('source')) {
                    const wrapper = document.createElement('div');
                    wrapper.classList.add('test-wrapper');
    
                    const toolbar = document.createElement('div');
                    const handle = document.createElement('i');
                    handle.classList.add('fa', 'fa-heart', 'handle');
    
                    toolbar.appendChild(handle);
    
                    wrapper.appendChild(toolbar);
    
                    const content = document.createElement('div');
                    content.setAttribute('contenteditable', true);
                    content.innerHTML = el.getElementsByClassName('chunk')[0].innerHTML;
                    content.addEventListener('keypress', e => {
                        if ((e.charCode === 13) && (e.shiftKey === false)) {
                            e.preventDefault();
                            return false;
                        }
                    });
    
                    wrapper.appendChild(content);
    
                    el.parentNode.replaceChild(wrapper, el);
                }
            });

            this.drake.on('drag', (el, source) => {
                emitter.emit('fred-hide');
            });

            this.drake.on('dragend', el => {
                emitter.emit('fred-show');
            });
        } else {
            this.drake.containers = [document.querySelector('.source'), document.querySelector('.content')];
        }
    }
}