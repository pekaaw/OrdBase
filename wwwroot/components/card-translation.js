'use strict';
import html from './card-translation.html';


export class Component_TranslationCard extends HTMLElement { 
    constructor() {
        super();
        this.root = this.createShadowRoot();
        this.root.innerHTML = html;

        this.button  = this.root.querySelector('button');
        this.template = this.root.getElementById('template-languagekey-complete');
    }
    
    set key (key)            { this.root.querySelector('span').innerHTML = key;  }
    set onClickCard(handler) { this.root.querySelector('button').onclick = handler; }

    makeLanguagekeyComplete(languageKey, isComplete) { 

        let fragment = this.template.content.cloneNode(true);

        fragment.querySelector('span').innerHTML = languageKey;
        if (isComplete === true) {
            fragment.querySelector('i').classList.remove('fa-times');
            fragment.querySelector('i').classList.add('fa-check');
        }
        this.root.getElementById('array-languagekey-complete').appendChild(fragment);
    }

    toggleDeleteable() {
        this.button.classList.toggle('deleteable');        
    }

    isDeleteable() {
        this.button.classList.contains('deleteable');
    }
}
customElements.define('component-card-translation', Component_TranslationCard);