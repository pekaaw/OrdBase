'use strict';

import * as App from './App.js';
import * as Route from '../lib/Route.js';
import { force } from '../lib/Util.js'; 

import { View_SelectTranslation } from '../views/select-translation.js';

import { Component_Header }               from '../components/header.js';
import { Component_TranslationCard }      from '../components/card-translation.js';
import { Component_TranslationGenerator } from '../components/generator-translation.js';
import { Component_ContainerPicker }      from '../components/picker-container.js';

import { load_selectClient }    from './load_selectClient.js';


//
// @function loadSelectTranslation
//  @note @todo
//
export function loadSelectTranslation (clientKey) {
    
    //
    // 0. Init components
    //
    const view             = new View_SelectTranslation;
    const languageKeyArray = new Array();
    const header           = new Component_Header;
    const generator        = new Component_TranslationGenerator;
    const picker           = new Component_ContainerPicker;
    const cardPrototype    = new Component_TranslationCard;
    
    //
    // 1. Async calls
    //
    // Populate languageArray
    async_client_getLanguageKeyArray({ 
        clientKey: clientKey,
        success: _languageKeyArray => {
            languageKeyArray.push.apply(languageKeyArray, _languageKeyArray);
        }  
    });

    // Populate picker and set up default item
    async_client_getContainerKeyArray({ 
        clientKey: clientKey, 
        success: containerKeyArray => {
            
            // Populate generator with translation cards
            async_translation_getGroupMetaArray({ 
                clientKey: clientKey, 
                containerKey: containerKeyArray[0],
                success: groupMetaArray => {  
                    groupMetaArray.forEach(groupMeta => {
                        let card = makeTranslationCard({ cardPrototype: cardPrototype,  groupMeta: groupMeta})
                        generator.addCard(card);
                    });
                    generator.focus();    
                }
            });

            containerKeyArray.forEach(containerKey => {

                picker.makeItem({
                    key: containerKey, 
                    text: containerKey,

                    // On picker-item click, reload all translation cards
                    onclick: e => {
                        
                        async_translation_getGroupMetaArray({
                            clientKey: clientKey, 
                            containerKey: picker.getContainerKey(),
                            success: groupMetaArray => {
                                generator.clearItems();
                                groupMetaArray.forEach(groupMeta => {
                                    let card = makeTranslationCard({ cardPrototype: cardPrototype, groupMeta: groupMeta});
                                    generator.addCard(card);      
                                }) 
                            },
                        });

                        header.setColor(App.COLOR_SUCCESS);
                        header.setTextBig('Select translation');
                    },

                });
            });
            picker.setDefaultItem();
        }
    });
    

    //
    // 2. Hook up Translation card event handlers
    //
    cardPrototype.setEventHandlers({
        onopen: (card, e) => { 

            

            // Generate fieldsets
            async_translation_getGroup({ 
                clientKey:     clientKey, 
                containerKey:  picker.getContainerKey(), 
                translationKey: card.getTranslationKey(),
                success: group => {
                    group.items.forEach(item => {
                        card.makeFieldset({languageKey: item.languageKey, text:  item.text, isComplete: item.isComplete})
                    });
                    card.display();
                } 
            })

            // @TODO close other open cards
            header.setColor(App.COLOR_SELECT);
            header.setTextBig('Edit translation');
            card.open({ languageCount: languageKeyArray.length });            
        },

        onclose: () => {
            header.setColor(App.COLOR_SUCCESS);
            header.setTextBig('Select translation');
        },

        ondelete:(card, e) => { 
            // Delete translation
            async_translation_delete({ 
                clientKey:      clientKey, 
                containerKey:   picker.getContainerKey(), 
                translationKey: card.getTranslationKey(),
                success: () => {
                    card.delete();
                    generator.getCardArray().forEach(_card => _card.close()); 
                }
            });
        },
        onsubmit: (card, e) => {         

            let translationArray = new Array();
            let formData = card.getFormData();

            formData.fieldsetArray.forEach(fieldset => {
            
                translationArray.push({
                    clientKey    : clientKey,
                    languageKey  : fieldset.languageKey,
                    containerKey : picker.getContainerKey(),
                    key          : formData.translationKey,
                    text         : fieldset.text,
                    isComplete   : fieldset.isComplete,
                });
            });
            
            async_translation_updateArray({ translationArray: translationArray,
               
                success: () => {
                    //
                    // @note Here I am updating ALL cards withing a container, even though 
                    //       only 1 card has been updated. It would be better to JUST updated that card.
                    //       The reason I dont do that yet, was that it was faster to just copy paste existing code snippet. - JSolsvik 02.08.17
                    //
                    generator.clearItems();

                    async_translation_getGroupMetaArray({ 
                        clientKey: clientKey, 
                        containerKey: picker.getContainerKey(),
                        success: groupMetaArray => {  
                            groupMetaArray.forEach(groupMeta => {
                                let card = makeTranslationCard({ cardPrototype: cardPrototype,  groupMeta: groupMeta})
                                generator.addCard(card);
                            });
                            generator.focus();
                            generator.deactivateInput();
                        }
                    });
                }
            });
        },
    });

    //
    // 2. Setup header
    //
    header.setTheme({textSmall: 'Ordbase', textBig: 'Select Translation', selectable: true})
    header.setIcons({ button1: App.ICON_TRASH, button2: App.ICON_ARROW_LEFT });
    header.setEventHandlers({
        
        // 2.1 Delete translation
        button1_onclick:  e => {
        
            let cardArray = generator.getCardArray();

            console.log(cardArray);
            if(cardArray.length > 0) {
                if (!cardArray[0].isDeleteable()) {
                    header.setTextBig('Delete Translation');
                    header.setColor(App.COLOR_DANGER);
                    cardArray.forEach(card => { 
                        card.close(); 
                        card.setDeleteable();
                    });
                }
                else {
                    header.setTextBig('Select Translation');
                    header.setColor(App.COLOR_SUCCESS);
                    cardArray.forEach(card => card.setOpenable());   

                }
            }                
        },
        // 2.2 Back to select client view
        button2_onclick:  e => load_selectClient(), 
    });


    //
    // 3. Setup Component_TranslationGenerator
    //
    generator.OnGenerate( e => {
       
        let translationArray = new Array();

        languageKeyArray.forEach(languageKey => {
        
            translationArray.push({
                clientKey : clientKey,
                languageKey : languageKey,
                containerKey : picker.getContainerKey(),
                key : generator.getInputValue(),
                text : 'default',
                isComplete : false,
            });
        });

        async_translation_createArray({ 
            translationArray: translationArray,
            success: (groupMeta) => {
                let card = makeTranslationCard({cardPrototype: cardPrototype, groupMeta: groupMeta}) 
                generator.addCard(card);
            } 
        });
    });

    //
    // 5. Insert components into view, and add view to DOM
    //
    view.setTranslationGenerator(generator);
    view.setContainerPicker(picker);
    App.setHeader(header);
    App.switchView(view);
}


//
// @function makeTranslationCard
//
function makeTranslationCard({ cardPrototype = force('cardPrototype'), 
                               groupMeta = force('groupMeta')}) {
                                    
    let card = new Component_TranslationCard;

    card.setTranslationKey(groupMeta.key);
    
    groupMeta.items.forEach(item => {
        card.makeLanguagekeyComplete(item.languageKey, item.isComplete);
    });

    card.setEventHandlers(cardPrototype.getEventHandlers());
    return card;
}

//
// @function __async__getLanguageKeyArray
//
function async_client_getLanguageKeyArray({ clientKey = force('clientKey'), 
                                               success   = force('success') }){
        
    Route.client_getLanguages({clientKey: clientKey}).then(languageKeyArray => {
        success(languageKeyArray);
    })
    .catch(err => console.error('Error:', err));      
}


//
// @function async_translation_getGroup
//
function async_translation_getGroup({ success       = force('success'),
                                         clientKey     = force('clientKey'),
                                         containerKey  = force('containerKey'),
                                         translationKey = force('translationKey'), }) {

    Route.translation_getGroup({clientKey: clientKey,
                                containerKey: containerKey,
                                translationKey: translationKey}).then((groupArray) => {
      if (groupArray.length > 0) {
            let group = groupArray[0];
            success(group);
      } else {
          App.HEADER.flashError('Pick a container to enable editing!');
      }

    }).catch(err => console.error('Error: ', err));
}


//
// @function __async__getContainerKeyArray 
//
function async_client_getContainerKeyArray ({  success  = force('success'),
                                                  clientKey   = force('clientKey') }) {

    Route.client_getContainers({clientKey: clientKey}).then(containerKeyArray => {        
        success(containerKeyArray);
    })
    .catch(err => console.error('Error:', err));      
}

//
// @function async_translation_getGroupMetaArray
//
function async_translation_getGroupMetaArray({ success      = force('success'),
                                                  clientKey    = force('clientKey'), 
                                                  containerKey = force('containerKey') }) {

    Route.translation_getGroupMeta({clientKey:    clientKey, 
                                    containerKey: containerKey}).then(groupMetaArray => {
        success(groupMetaArray);
    })
    .catch(err => console.error('Error:', err));  
}

//
// @function async_translation_getGroupMeta
//
function async_translation_getGroupMeta({ success      = force('success'), 
                                             clientKey   = force('clientKey'),
                                             containerKey = force('containerKey'),
                                             translationKey = force('translationKey')}) {

    Route.translation_getGroupMeta(arguments[0]).then(groupMetaArray => {
        let groupMeta = groupMetaArray[0];
        success(groupMeta)
    })
    .catch(err => console.error('Error:', err));      
}

//
// @function async_translation_createArray
//
function async_translation_createArray({ success         = force('success'), 
                                            translationArray = force('translationArray')}) {

    Route.translation_createArray({ translationArray: translationArray }).then(res => {

        if(res.status != App.HTTP_CREATED) {
            App.HEADER.flashError(`${res.status}: Was not able to create new translations...`);
            throw new Error('translation_createArray(): ', res.status);
        }

        return Route.translation_getGroupMeta({ clientKey: translationArray[0].clientKey, 
                                                containerKey: translationArray[0].containerKey, 
                                                translationKey: translationArray[0].key }); 
    })
    .then(groupMetaArray => {
        let groupMeta = groupMetaArray[0];
        success(groupMeta);
    })
    .catch(err => console.error(err));
}

//
// @function async_translation_delete
//

function    async_translation_updateArray({ success= force('success'), translationArray = force('translationArray') }) {

    Route.translation_updateArray({ translationArray: translationArray, 
                                    clientKey: translationArray[0].clientKey, 
                                    containerKey: translationArray[0].containerKey, 
                                    translationKey: translationArray[0].key })
    .then(res => {
        console.log('translation_updateArray():', res.status);
        
        if (App.HTTP_UPDATED) {
            success();
        } else {
            App.HEADER.flashError('Code ${res.status}: Something went wrong while updating the translations..');
        }
    })
    .catch(err => console.error('Error:', err));                                
}


//
// @function async_translation_delete
//
function async_translation_delete({  success        = force('success'),
                                        clientKey      = force('clientKey'), 
                                        containerKey   = force('containerKey'), 
                                        translationKey = force('translationKey'), }) {

    Route.translation_deleteGroup({clientKey: clientKey, 
                                   containerKey: containerKey, 
                                   translationKey: translationKey})
    .then(res => {

        console.log('translation_deleteGroup():', res.status);
        
        if (res.status == App.HTTP_OK) {
            success();
        }
        else {
            App.HEADER.flashError(`${res.status}: Was not able to delete card...`);
        }        
    }).catch(err => console.error('Error:', err));
}