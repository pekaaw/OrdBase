'use strict';

import * as App from './App.js';
import * as Ordbase from '../lib/Ordbase.js';
import * as TranslatePlugin from '../lib/Ordbase-translate-plugin.js';
import { force } from  '../lib/Util.js'; 

import { View_SelectClient }      from '../views/select-client.js';
import { Component_ClientCard   } from '../components/card-client.js';
import { Component_Header   }     from '../components/header.js';

import { load_editClient }        from './load-editClient.js';
import { load_newClient }         from './load-newClient.js'; 
import { load_selectTranslation } from './load-selectTranslation.js';



//
// @function load_selectClient
//
export function load_selectClient() {

    //
    // -1. Set up Ordbase
    //
    TranslatePlugin.OnLanguageChange(() => { load_selectClient(); });
    TranslatePlugin.async_loadContainer('Ordbase', 'SelectClient');

    //
    // 0. Create component instances
    //
    const header = new Component_Header;
    const view   = new View_SelectClient;

    //
    // 1. Fire async call
    //
    async_client_getArray({
        success: clientArray => {
            clientArray.forEach(client => {

                let card = new Component_ClientCard;

                card.setKey(client.key);
                card.setHeading(client.key);
                card.setText(client.webpageUrl);
                card.setThumbnail(client.thumbnailUrl);
                
                card.setEventHandlers({
                    onselect: (card, e) => { load_selectTranslation(card.getKey()) },
                    onedit:   (card, e) => { load_editClient(card.getKey())},
                });

                card.setSelectable();
                view.addCard(card)
            });                 

            view.focus();
        }
    });

    //
    // 3. Set up header
    //
    TranslatePlugin.translate('selectClient', text => {  header.setTheme({ textSmall: 'Ordbase', textBig: text, selectable: true }) });
    header.setIcons({ button1: App.ICON_PENCIL, button2: App.ICON_PLUS });   
    header.setEventHandlers({

        button1_onclick: event => { 

            let cardArray = view.getCardArray();
            
            if (!cardArray[0].isEditable()) {
                cardArray.forEach(card => card.setEditable());           
                TranslatePlugin.translate('editClient', text => header.setTheme({ textBig: text, editable: true }));
                header.setIcons({ button1: '', button2: App.ICON_TIMES, });
                header.setEventHandlers({

                    button2_onclick: e => { 
                        cardArray.forEach(card => card.setSelectable());            
                        TranslatePlugin.translate('selectClient', text => header.setTheme({textBig: text, selectable: true}));
                        header.setIcons({ button1: App.ICON_PENCIL, button2: App.ICON_PLUS, });       
                        header.setEventHandlers({ button2_onclick: e => { load_newClient() }});        
                        view.focus();            
                    }
                });       
                view.focus();                    
            }
        },

        button2_onclick: e => { load_newClient() },
    });

    //
    // 5. Insert new view into DOM
    //
    App.setHeader(header);
    App.setView(view);
}

//
// @function async_deleteCard
//  @note todo
//
function async_client_getArray({ success = force('success') }) {

    // @note preload_clientArrayPromise is declared in index.html to make initial loading faster - JSolsvik 09.08.17
    if (!preload_clientArrayPromise) {
        Ordbase.client_get().then(clientArray => {
            if (clientArray.length > 0)  
                success(clientArray);
            else
                App.flashError(TranslatePlugin.translate('errorNoClients'));
        })
        .catch(err => App.flashError(err));
    }
    else {
        preload_clientArrayPromise.then(clientArray => {
            if (clientArray.length > 0)  {
                success(clientArray);
            }
            else { 
                App.flashError(TranslatePlugin.translate('errorNoClients'));
            }   
        });
        preload_clientArrayPromise = null;
    }
}