import flatpickr from "flatpickr";
import Choices from 'choices.js';
import ColorPicker from './../ColorPicker/ColorPicker';
import noUiSlider from 'nouislider';
import fetch from "isomorphic-fetch";
import Finder from "./../Finder";
import fredConfig from './../Config';
import {div, label, input, select as selectElement, span, textArea, a, img, button} from './Elements';
import emitter from "../EE";
import { fixChoices } from "../Utils";
import Tagger from "./Tagger";
import cache from '../Cache';

export const text = (setting, defaultValue = '', onChange, onInit) => {
    const labelEl = label(setting.label || setting.name);

    const inputEl = input(defaultValue);

    let errorEl = null;
    
    inputEl.addEventListener('keyup', e => {
        if (errorEl !== null) {
            errorEl.remove();
            inputEl.removeAttribute('aria-invalid');
            errorEl = null;
        }
        
        if (typeof onChange === 'function') {
            onChange(setting.name, inputEl.value, inputEl, setting);
        }
    });
    
    labelEl.onError = msg => {
        inputEl.setAttribute('aria-invalid', 'true');
        if (errorEl === null) {
            errorEl = div('error', msg);
            labelEl.appendChild(errorEl);
        } else {
            errorEl.innerHTML = msg;
        }
    };

    labelEl.appendChild(inputEl);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, inputEl);
    }
    
    return labelEl;
};

export const select = (setting, defaultValue = '', onChange, onInit) => {
    const labelEl = label(setting.label || setting.name);

    const selectEl = selectElement();

    if (setting.options) {
        for (let value in setting.options) {
            if (setting.options.hasOwnProperty(value)) {
                const option = document.createElement('option');
                option.innerHTML = setting.options[value];
                option.value = value;

                if (value === defaultValue) {
                    option.setAttribute('selected', 'selected');
                }

                selectEl.appendChild(option);
            }
        }
    }
    
    if (typeof onChange === 'function') {
        selectEl.addEventListener('change', e => {
            if (setting.options[selectEl.value]) {
                onChange(setting.name, selectEl.value, selectEl, setting);
            }
        });
    }

    labelEl.appendChild(selectEl);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, selectEl);
    }

    return labelEl;
};

export const toggle = (setting, defaultValue = false, onChange, onInit) => {
    const labelEl = label((setting.label || setting.name), 'fred--toggle');

    const inputEl = input(defaultValue, 'checkbox');

    if (typeof onChange === 'function') {
        inputEl.addEventListener('change', e => {
            onChange(setting.name, e.target.checked, inputEl, setting);
        });
    }

    const spanEl = span();

    labelEl.appendChild(inputEl);
    labelEl.appendChild(spanEl);
    
    if (typeof onInit === 'function') {
        onInit(setting, labelEl, inputEl, spanEl);
    }

    return labelEl;
};

export const area = (setting, defaultValue = '', onChange, onInit) => {
    const labelEl = label(setting.label || setting.name);

    const textAreaEl = textArea(defaultValue);

    if (typeof onChange === 'function') {
        textAreaEl.addEventListener('keyup', e => {
            onChange(setting.name, textAreaEl.value, textAreaEl, setting);
        });
    }

    labelEl.appendChild(textAreaEl);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, textAreaEl);
    }

    return labelEl;
};

export const dateTime = (setting, defaultValue = 0, onChange, onInit) => {
    defaultValue = parseInt(defaultValue) || 0;
    
    const labelEl = label(setting.label || setting.name);
    const group = div(['fred--input-group', 'fred--datetime']);
    const inputEl = input();

    const picker = flatpickr(inputEl, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        appendTo: group,
        defaultDate: (defaultValue === 0) ? '' : (defaultValue * 1000),
        onChange: selectedDates => {
            if (typeof onChange === 'function') {
                if (selectedDates.length === 0) {
                    onChange(setting.name, 0, picker, setting);
                } else {
                    onChange(setting.name, selectedDates[0].getTime() / 1000, picker, setting);
                }
            }
        }
    });

    const clear = a('', 'fred.fe.clear', '', 'fred--close-small', () => {
        picker.clear();
    });

    group.appendChild(inputEl);
    group.appendChild(clear);

    labelEl.appendChild(group);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, inputEl);
    }

    return labelEl;
};

export const colorSwatch = (setting, defaultValue = '', onChange, onInit) => {
    const labelEl = label(setting.label || setting.name);
    const wrapper = div('fred--color_swatch');
    const preview = div('fred--color_swatch-preview');
    const colors = div(['fred--color_swatch-colors', 'fred--hidden']);
    
    if (defaultValue) {
        preview.style.backgroundColor = defaultValue;
    }

    let isOpen = false;

    preview.addEventListener('click', e => {
        e.preventDefault();
        if (isOpen === false) {
            isOpen = true;
            colors.classList.remove('fred--hidden');
        } else {
            isOpen = false;
            colors.classList.add('fred--hidden');
        }
    });
    
    let defaultValueTranslated = false;

    if (setting.options) {
        setting.options.forEach(value => {
            if (typeof value === 'object') {
                const option = div('fred--color_swatch-color');
                option.style.background = value.color;
                
                if (value.width && parseFloat(value.width) > 1) {
                    option.style.width = (parseFloat(value.width) * 30) + 'px';
                }
                
                if (value.label && value.label.trim() !== '') {
                    option.setAttribute('data-tooltip', value.label);
                }

                if (!defaultValueTranslated && defaultValue && (value.value === defaultValue)) {
                    defaultValueTranslated = true;
                    
                    if (defaultValue) {
                        preview.style.background = value.color;
                    }
                }
                
                option.addEventListener('click', e => {
                    e.preventDefault();
                    if (typeof onChange === 'function') {
                        onChange(setting.name, value.value, option, setting);
                    }

                    preview.style.background = value.color;
                });

                colors.appendChild(option);
            } else {
                const option = div('fred--color_swatch-color');
                option.style.backgroundColor = value;
    
                option.addEventListener('click', e => {
                    e.preventDefault();
                    if (typeof onChange === 'function') {
                        onChange(setting.name, value, option, setting);
                    }
    
                    preview.style.background = value;
                });
                
                colors.appendChild(option);
            }
        });
    }

    wrapper.appendChild(preview);
    wrapper.appendChild(colors);
    
    labelEl.appendChild(wrapper);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, wrapper, preview, colors);
    }
    
    return labelEl;
};

export const colorPicker = (setting, defaultValue = '', onChange, onInit) => {
    const labelEl = label(setting.label || setting.name);
    const wrapper = div('fred--color_picker');
    const preview = div('fred--color_picker-preview');
    
    let isOpen = false;
    let pickerInstance = null;

    preview.addEventListener('click', e => {
        e.preventDefault();
        if (isOpen === false) {
            isOpen = true;
            
            pickerInstance = ColorPicker.createPicker({
                attachTo: picker,
                color: defaultValue,
                showAlpha: (setting.showAlpha === undefined) ? true : setting.showAlpha,
                paletteEditable: false,
                palette: setting.options || null
            });
            
            pickerInstance.onchange = (picker) => {
                if (typeof onChange === 'function') {
                    onChange(setting.name, picker.color, picker, setting);
                }

                preview.style.backgroundColor = picker.color;
                defaultValue = picker.color;
            };
        } else {
            if (pickerInstance !== null) {
                pickerInstance.element.remove();
                pickerInstance = null;
            }

            isOpen = false;
        }
    });
    
    if (defaultValue) {
        preview.style.backgroundColor = defaultValue;
    }

    const picker = div();
    
    wrapper.appendChild(preview);
    wrapper.appendChild(picker);
    
    labelEl.appendChild(wrapper);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, wrapper, preview, picker);
    }
    
    return labelEl;
};

export const slider = (setting, defaultValue = 0, onChange, onInit) => {
    const labelEl = label(setting.label || setting.name);

    if (!setting.min && !setting.max) {
        console.error('Slider Input error. Parameters min and max are required');
        return labelEl;
    }
    
    const sliderEl = div();

    let init = false;
    let step = 1;
    if (setting.step) {
        step = setting.step;
    } else {
        if (setting.tooltipDecimals) {
            step = Math.pow(10, -1 * setting.tooltipDecimals);
        }
    }
    
    const slider = noUiSlider.create(sliderEl, {
        start: defaultValue,
        connect: [true, false],
        tooltips: {
            to: value => {
                const decimals = (setting.tooltipDecimals === undefined) ? 0 : setting.tooltipDecimals;
    
                if (decimals === 0) {
                    return parseInt(value.toFixed());
                }
                
                return parseFloat(value.toFixed(decimals));
            }
        },
        format: {
            to: function ( value ) {
                const decimals = (setting.tooltipDecimals === undefined) ? 0 : setting.tooltipDecimals;

                if (decimals === 0) {
                    return parseInt(value.toFixed());
                }

                return parseFloat(value.toFixed(decimals));
            },
            from: function ( value ) {
                const decimals = (setting.tooltipDecimals === undefined) ? 0 : setting.tooltipDecimals;

                if (decimals === 0) {
                    return parseInt(value);
                }

                return parseFloat(value).toFixed(decimals);
            }
        },
        step: step,
        range: {
            'min': setting.min,
            'max': setting.max
        }
    });

    sliderEl.querySelector('.noUi-handle').addEventListener('keydown', function( e ) {

        const value = Number(sliderEl.noUiSlider.get());

        if (e.which === 37) {
            sliderEl.noUiSlider.set(value - step);
        }

        if (e.which === 39) {
            sliderEl.noUiSlider.set(value + step);
        }
    });

    if (typeof onChange === 'function') {
        slider.on('update', (values, handle, unencoded, tap, positions) => {
            if (init === false) {
                init = true;
            } else {
                onChange(setting.name, values[0], slider, setting);
            }
        });
    }

    labelEl.appendChild(sliderEl);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, sliderEl);
    }

    return labelEl;
};

export const page = (setting, defaultValue = {id: 0, url: ''}, onChange, onInit) => {
    const wrapper = div();
    const labelEl = label((setting.label || setting.name), 'fred--label-choices');
    const selectEl = selectElement();

    wrapper.appendChild(labelEl);
    wrapper.appendChild(selectEl);
    
    let lookupTimeout = null;
    const lookupCache = {};
    let initData = [];

    const pageChoices = new Choices(selectEl, {
        shouldSort:false,
        removeItemButton: setting.clearButton || false,
        searchResultLimit: 0
    });

    fixChoices(pageChoices);

    let queryOptions = '';
    
    if (setting.parents) {
        queryOptions += `&parents=${setting.parents}`;
    }
    
    if (setting.resources) {
        queryOptions += `&resources=${setting.resources}`;
    }
    
    if (setting.depth) {
        queryOptions += `&depth=${setting.depth}`;
    }
    
    pageChoices.ajax(callback => {
        fetch(`${fredConfig.config.assetsUrl}endpoints/ajax.php?action=get-resources&current=${defaultValue.id}${queryOptions}`, {
            credentials: 'same-origin'
        })
            .then(response => {
                return response.json()
            })
            .then(json => {
                initData = json.data.resources;
                callback(json.data.resources, 'value', 'pagetitle');

                if (json.data.current) {
                    pageChoices.setChoices([json.data.current], 'value', 'pagetitle', false);
                    pageChoices.setValueByChoice("" + defaultValue.id);
                }
            })
            .catch(error => {
                emitter.emit('fred-loading', error.message);
            });
    });

    const populateOptions = options => {
        const toRemove = [];

        pageChoices.currentState.items.forEach(item => {
            if (item.active) {
                toRemove.push(item.value);
            }
        });

        const toKeep = [];
        options.forEach(option => {
            if (toRemove.indexOf(option.id) === -1) {
                toKeep.push(option);
            }
        });

        pageChoices.setChoices(toKeep, 'value', 'pagetitle', true);
    };

    const serverLookup = () => {
        const query = pageChoices.input.value;
        if (query in lookupCache) {
            populateOptions(lookupCache[query]);
        } else {
            fetch(`${fredConfig.config.assetsUrl}endpoints/ajax.php?action=get-resources&query=${query}${queryOptions}`, {
                credentials: 'same-origin'
            })
                .then(response => {
                    return response.json()
                })
                .then(data => {
                    lookupCache[query] = data.data.resources;
                    populateOptions(data.data.resources);
                })
                .catch(error => {
                    emitter.emit('fred-loading', error.message);
                });
        }
    };

    pageChoices.passedElement.addEventListener('search', event => {
        clearTimeout(lookupTimeout);
        lookupTimeout = setTimeout(serverLookup, 200);
    });

    pageChoices.passedElement.addEventListener('choice', event => {
        pageChoices.setChoices(initData, 'value', 'pagetitle', true);

        if (typeof onChange === 'function') {
            onChange(setting.name, {
                url: event.detail.choice.customProperties.url,
                id: event.detail.choice.value
            }, pageChoices, setting);
        }
    });

    pageChoices.passedElement.addEventListener('removeItem', event => {
        if (pageChoices.getValue()) return;

        if (typeof onChange === 'function') {
            onChange(setting.name, {url: '', id: ''}, pageChoices, setting);
        }
    });

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, selectEl);
    }

    return wrapper;
};

export const image = (setting, defaultValue = '', onChange, onInit) => {
    const labelEl = label(setting.label || setting.name);

    setting.showPreview = (setting.showPreview === undefined) ? true : setting.showPreview;

    const inputWrapper = div(['fred--input-group', 'fred--browse']);
    
    const inputEl = input(defaultValue);

    const openFinderButton = a('', 'fred.fe.browse', '', 'fred--browse-small');

    const preview = img('');
    let previewAdded = false;
    
    const finderOptions = {};
    
    if (setting.mediaSource && (setting.mediaSource !== '')) {
        finderOptions.mediaSource = setting.mediaSource;
    }

    inputEl.addEventListener('keyup', e => {
        if((setting.showPreview === true) && inputEl.value) {
            preview.src = inputEl.value;
            if (!previewAdded) {
                labelEl.appendChild(preview);
                previewAdded = true;
            }
        } else {
            if (previewAdded) {
                preview.src = '';
                preview.remove();
                previewAdded = false;
            } 
        }

        if (typeof onChange === 'function') {
            onChange(setting.name, inputEl.value, inputEl, setting);
        }
    });
    
    openFinderButton.addEventListener('click', e => {
        e.preventDefault();

        const finder = new Finder((file, fm) => {
            if (typeof onChange === 'function') {
                onChange(setting.name, file.url, inputEl, setting);
            }
            
            inputEl.value = file.url;
            preview.src = file.url;
            
            if ((setting.showPreview === true) && !previewAdded) {
                labelEl.appendChild(preview);
                previewAdded = true;
            }
        }, 'fred.fe.browse_images', finderOptions);

        finder.render();
    });

    inputWrapper.appendChild(inputEl);
    inputWrapper.appendChild(openFinderButton);

    labelEl.appendChild(inputWrapper);

    if(inputEl.value) {
        preview.src = inputEl.value;
    }
    
    if ((setting.showPreview === true) && preview.src) {
        labelEl.appendChild(preview);
        previewAdded = true;
    }

    labelEl.setPreview = src => {
        if (setting.showPreview !== true) return;
        preview.src = src;
        
        if (previewAdded === false) {
            labelEl.appendChild(preview);
            previewAdded = true;
        }
    };

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, inputEl);
    }

    return labelEl;
};

export const choices = (setting, defaultValue = '', onChange, onInit) => {
    const wrapper = div();
    const labelEl = label(setting.label || setting.name);
    const selectEl = selectElement();

    let errorEl = null;
    
    wrapper.appendChild(labelEl);
    wrapper.appendChild(selectEl);
    const config = setting.choices || {};
    config.searchResultLimit = 0;
    
    const choicesInstance = new Choices(selectEl, config);
    fixChoices(choicesInstance);
    
    if (typeof onChange === 'function') {
        choicesInstance.passedElement.addEventListener('choice', event => {
            if (errorEl !== null) {
                errorEl.remove();
                errorEl = null;
            }
            
            onChange(setting.name, event.detail.choice, selectEl, setting, choicesInstance);
        });
    }

    labelEl.onError = msg => {
        if (errorEl === null) {
            errorEl = div('error', msg);
            labelEl.appendChild(errorEl);
        } else {
            errorEl.innerHTML = msg;
        }
    };

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, selectEl, choicesInstance, defaultValue);
    }

    return wrapper;
};

export const tagger = (setting, defaultValue = '', onChange, onInit) => {
    setting.limit = setting.limit || 0;

    const tempField = div();
    
    const tags = cache.load('tagger', {group: setting.group, autoTag: setting.autoTag}, () => {
        return fetch(`${fredConfig.config.assetsUrl}endpoints/ajax.php?action=tagger-get-group&group=${setting.group}&includeTags=${setting.autoTag | 0}`, {
            credentials: 'same-origin'
        })
            .then(response => {
                return response.json()
            })
            .then(json => {
                return json.data.group.tags;
            })
            .catch(error => {
                emitter.emit('fred-loading', error.message);
            });
    });

    tags.then(value => {
        const currentTags = defaultValue.split(',').filter(e => {return e;});
        const taggerField = new Tagger({
            id: setting.group,
            name: setting.label || setting.name,
            tag_limit: setting.limit || 0,
            field_type: 'tagger-field-tags',
            hide_input: setting.hideInput || false,
            show_autotag: setting.autoTag || false,
            allow_new: false,
            as_radio: false,
            tags: value
        }, currentTags, newTags => {
            onChange(setting.name, newTags.join(','), field, setting, taggerField);
        });

        const field = taggerField.render();

        tempField.replaceWith(field);
    });

    return tempField;
};

export default {
    text,
    select,
    toggle,
    area,
    dateTime,
    colorSwatch,
    colorPicker,
    slider,
    page,
    image,
    choices,
    tagger
};