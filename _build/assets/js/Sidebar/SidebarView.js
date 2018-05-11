import fredConfig from './../Config';
import { div, img, h1, dl } from './../UI/Elements';

let wrapper;

/**
 * @param components
 * @param onComponentAdd
 * @param onClose
 */
export const render = (components, onComponentAdd, onClose) => {
    const buildComponents = () => {
        const sidebar = dl('fred--accordion');

        components.forEach(component => {
            const addedComponent = new component(sidebar);
            onComponentAdd(addedComponent);
        });
        
        return sidebar;
    };
    
    const logo = img(`${fredConfig.config.assetsUrl || ''}images/modx-revo-icon-48.svg`, 'MODX FRED', 'fred--logo');
    logo.setAttribute('title', fredConfig.lng('fred.fe.close_sidebar'));
    logo.addEventListener('click', e => {
        e.preventDefault();
        onClose();
    });
    
    wrapper = div(['fred--sidebar', 'fred--hidden'], [
        div('fred--sidebar_title', [
            logo,
            h1('Fred')
        ])
    ]);
    
    wrapper.appendChild(buildComponents());
    wrapper.setAttribute('aria-hidden', 'true');

    return wrapper;
};

export const show = () => {
    wrapper.classList.remove('fred--hidden');
};

export const hide = () => {
    wrapper.classList.add('fred--hidden');
};

export const isVisible = () => {
    return !wrapper.classList.contains('fred--hidden')
};

export default {
    render,
    show,
    hide,
    isVisible
};