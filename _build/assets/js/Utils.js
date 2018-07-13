import {div} from "./UI/Elements";
import ContentElement from "./Components/Sidebar/Elements/ContentElement";
import fredConfig from './Config';

export const debounce = (delay, fn) => {
    let timerId;
    
    return function (...args) {
        if (timerId) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
            fn(...args);
            timerId = null;
        }, delay);
    };
};

export const errorHandler = response => {
    if ((response.status >= 200) && (response.status < 300)) {
        return response.json();
    }

    return response.json().then(json => {
        const err = new Error(json.message);
        err.response = json;

        throw err;
    })    
};

export const applyScripts = el => {
    const scripts = el.querySelectorAll('script');

    for (let scriptEl of scripts) {
        const script = document.createElement('script');
        script.dataset.fredRender = 'false';
        script.innerHTML = scriptEl.innerHTML;
        
        scriptEl.parentNode.replaceChild(script, scriptEl);
    }
};

export const fixChoices = choices => {
    const sortByScore = (a, b) => {
        return a.score - b.score;
    };
    
    choices.renderChoices = function(choices, fragment, withinGroup = false) {
        // Create a fragment to store our list items (so we don't have to update the DOM for each item)
        const choicesFragment = fragment || document.createDocumentFragment();
        const { renderSelectedChoices, searchResultLimit, renderChoiceLimit } = this.config;
        const filter = this.isSearching ? sortByScore : this.config.sortFilter;
        const appendChoice = (choice) => {
            const shouldRender = renderSelectedChoices === 'auto' ?
                (this.isSelectOneElement || !choice.selected) :
                true;
            if (shouldRender) {
                const dropdownItem = this._getTemplate('choice', choice);
                choicesFragment.appendChild(dropdownItem);
            }
        };
    
        let rendererableChoices = choices;
    
        if (renderSelectedChoices === 'auto' && !this.isSelectOneElement) {
            rendererableChoices = choices.filter(choice => !choice.selected);
        }
    
        // Split array into placeholders and "normal" choices
        const { placeholderChoices, normalChoices } = rendererableChoices.reduce((acc, choice) => {
            if (choice.placeholder) {
                acc.placeholderChoices.push(choice);
            } else {
                acc.normalChoices.push(choice);
            }
            return acc;
        }, { placeholderChoices: [], normalChoices: [] });
    
        // If sorting is enabled or the user is searching, filter choices
        if (this.config.shouldSort || this.isSearching) {
            normalChoices.sort(filter);
        }
    
        let choiceLimit = rendererableChoices.length;
    
        // Prepend placeholeder
        const sortedChoices = [...placeholderChoices, ...normalChoices];
    
        if (this.isSearching) {
            if (searchResultLimit > 0) {
                choiceLimit = searchResultLimit;
            }
        } else if (renderChoiceLimit > 0 && !withinGroup) {
            choiceLimit = renderChoiceLimit;
        }
    
        // Add each choice to dropdown within range
        for (let i = 0; i < choiceLimit; i++) {
            if (sortedChoices[i]) {
                appendChoice(sortedChoices[i]);
            }
        }
    
        return choicesFragment;
    };
};

const loadChildren = (zones, parent, elements, fireEvents = false) => {
    const dzPromises = [];
    
    for (let zoneName in zones) {
        if (zones.hasOwnProperty(zoneName)) {
            const promises = [];
            
            zones[zoneName].forEach(element => {
                const chunk = div(['chunk']);
                chunk.setAttribute('hidden', 'hidden');
                chunk.dataset.fredElementId = element.widget;
                chunk.dataset.fredElementTitle = elements[element.widget].title;
                chunk.elementMarkup = elements[element.widget].html;
                chunk.elementOptions = elements[element.widget].options || {};

                const contentElement = new ContentElement(chunk, zoneName, parent, element.values, (element.settings || {}));
                promises.push(contentElement.render().then(() => {
                    parent.addElementToDropZone(zoneName, contentElement);

                    return loadChildren(element.children, contentElement, elements, fireEvents).then(() => {
                        if (fireEvents === true) {
                            const event = new CustomEvent('FredElementDrop', {detail: {fredEl: contentElement}});
                            document.body.dispatchEvent(event);
    
                            const jsElements = contentElement.wrapper.querySelectorAll('[data-fred-on-drop]');
                            for (let jsEl of jsElements) {
                                if (window[jsEl.dataset.fredOnDrop]) {
                                    window[jsEl.dataset.fredOnDrop](jsEl);
                                }
                            }
                        }
                    });
                }));
            });

            dzPromises.push(Promise.all(promises));
        }
    }

    return Promise.all(dzPromises);
};

export const loadElements = data => {
    const zones = data.data;
    const dzPromises = [];

    for (let zoneName in zones) {
        if (zones.hasOwnProperty(zoneName)) {
            const zoneEl = document.querySelector(`[data-fred-dropzone="${zoneName}"]`);
            if (zoneEl) {
                const promises = [];

                zoneEl.innerHTML = '';
                zones[zoneName].forEach(element => {
                    const chunk = div(['chunk']);
                    chunk.setAttribute('hidden', 'hidden');
                    chunk.dataset.fredElementId = element.widget;
                    chunk.dataset.fredElementTitle = data.elements[element.widget].title;
                    chunk.elementMarkup = data.elements[element.widget].html;
                    chunk.elementOptions = data.elements[element.widget].options || {};

                    const contentElement = new ContentElement(chunk, zoneName, null, element.values, (element.settings || {}));
                    promises.push(contentElement.render().then(wrapper => {
                        loadChildren(element.children, contentElement, data.elements);
                        return wrapper;
                    }));

                });

                dzPromises.push(Promise.all(promises).then(wrappers => {
                    wrappers.forEach(wrapper => {
                        zoneEl.appendChild(wrapper);
                    });
                }));
            }
        }
    }
    
    return Promise.all(dzPromises);
};

export const loadBlueprint = (data, parent, target, sibling) => {
    const complete = data.complete || false;
    let emptyPage = true;
    
    for (let dz of fredConfig.fred.dropzones) {
        if (dz.querySelector('.fred--block')) {
            emptyPage = false;
            break;
        }
    }

    let elements = []; 
    
    if (complete === false) {
        elements = data.data;
    } else {
        if (emptyPage === true) {
            const zones = data.data;
            const dzPromises = [];
            
            for (let zoneName in zones) {
                if (zones.hasOwnProperty(zoneName)) {
                    const zoneEl = document.querySelector(`[data-fred-dropzone="${zoneName}"]`);
                    if (zoneEl) {
                        const promises = [];
    
                        zones[zoneName].forEach(element => {
                            const chunk = div(['chunk']);
                            chunk.setAttribute('hidden', 'hidden');
                            chunk.dataset.fredElementId = element.widget;
    
                            chunk.dataset.fredElementTitle = data.elements[element.widget].title;
                            chunk.elementMarkup = data.elements[element.widget].html;
                            chunk.elementOptions = data.elements[element.widget].options;
    
                            const contentElement = new ContentElement(chunk, zoneName, null, element.values, (element.settings || {}));
                            promises.push(contentElement.render().then(wrapper => {
                                loadChildren(element.children, contentElement, data.elements, true).then(() => {
                                    const event = new CustomEvent('FredElementDrop', {detail: {fredEl: contentElement}});
                                    document.body.dispatchEvent(event);
    
                                    const jsElements = contentElement.wrapper.querySelectorAll('[data-fred-on-drop]');
                                    for (let jsEl of jsElements) {
                                        if (window[jsEl.dataset.fredOnDrop]) {
                                            window[jsEl.dataset.fredOnDrop](jsEl);
                                        }
                                    }
                                });
                                
                                return wrapper;
                            }));
    
                        });
    
                        dzPromises.push(Promise.all(promises).then(wrappers => {
                            wrappers.forEach(wrapper => {
                                zoneEl.appendChild(wrapper);
                            });
                        }));
                    }
                }
            }
    
            return Promise.all(dzPromises);
        }
    
        let dzName = '';
        
        if (parent === null) {
            if (data.data[target.dataset.fredDropzone]) {
                dzName = target.dataset.fredDropzone;
                
            } else if (data.data['content']) {
                dzName = 'content';
            }
        } else {
            if (data.data['content']) {
                dzName = 'content';
            }
        }
    
        if (dzName === '') {
            console.error('Something wrong happened with blueprint.');
            return;
        }
        
        elements = data.data[dzName];
    }

    const promises = [];

    elements.forEach(element => {
        const chunk = div(['chunk']);
        chunk.setAttribute('hidden', 'hidden');
        chunk.dataset.fredElementId = element.widget;

        chunk.dataset.fredElementTitle = data.elements[element.widget].title;
        chunk.elementMarkup = data.elements[element.widget].html;
        chunk.elementOptions = data.elements[element.widget].options || {};

        const contentElement = new ContentElement(chunk, target.dataset.fredDropzone, parent, element.values, (element.settings || {}));

        promises.push(contentElement.render().then(() => {
            if (parent) {
                if (sibling === null) {
                    parent.dzs[target.dataset.fredDropzone].children.push(contentElement.wrapper);
                } else {
                    parent.dzs[target.dataset.fredDropzone].children.splice(parent.dzs[target.dataset.fredDropzone].children.indexOf(sibling), 0, contentElement.wrapper);
                }
            }

            loadChildren(element.children, contentElement, data.elements, true).then(() => {
                const event = new CustomEvent('FredElementDrop', {detail: {fredEl: contentElement}});
                document.body.dispatchEvent(event);

                const jsElements = contentElement.wrapper.querySelectorAll('[data-fred-on-drop]');
                for (let jsEl of jsElements) {
                    if (window[jsEl.dataset.fredOnDrop]) {
                        window[jsEl.dataset.fredOnDrop](jsEl);
                    }
                }
            });

            if (sibling !== null) {
                sibling.insertAdjacentElement('beforeBegin', contentElement.wrapper);
            } else {
                target.appendChild(contentElement.wrapper);
            }
        }));
    });

    return Promise.all(promises);
};