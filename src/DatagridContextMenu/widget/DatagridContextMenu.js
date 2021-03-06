/*global logger*/
/*
    DatagridContextMenu
    ========================

    @file      : DatagridContextMenu.js
    @version   : 1.1.0
    @author    : Jelle Dekker
    @date      : 2016/10/20
    @copyright : Bizzomate 2016
    @license   : Apache 2

    Documentation
    ========================
    Mendix widget that adds a context menu to the datagrid, based on the buttons in the datagrid toolbar.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
  "dojo/_base/declare",
  "mxui/widget/_WidgetBase",
  "dijit/_TemplatedMixin",

  "mxui/dom",
  "dojo/dom",
  "dojo/dom-geometry",
  "dojo/dom-class",
  "dojo/dom-style",
  "dojo/dom-construct",
  "dojo/_base/array",
  "dojo/_base/event",
  "dojo/query",
  "dojo/_base/lang",

  "dojo/text!DatagridContextMenu/widget/template/DatagridContextMenu.html"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoEvent, dojoQuery, dojoLang, widgetTemplate) {
  "use strict";

  // Declare widget's prototype.
  return declare("DatagridContextMenu.widget.DatagridContextMenu", [_WidgetBase, _TemplatedMixin], {
    // _TemplatedMixin will create our dom node using this HTML template.
    templateString: widgetTemplate,

    // DOM elements
    contextMenuList: null,
    contextMenuParent: null,

    // Parameters configured in the Modeler.
    datagridIdentifier: "",
    buttonsExclude: "",
    removeLabels: "",
    runInDebug: "",

    // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
    _dataGrid: null,
    _buttons: null,
    _contextMenuReady: null,

    // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
    constructor: function() {
      // Uncomment the following line to enable debug messages
      //logger.level(logger.DEBUG);

      logger.debug(this.id + ".constructor");
    },

    // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
    postCreate: function() {
      logger.debug(this.id + ".postCreate");

    },

    // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
    update: function(obj, callback) {
      logger.debug(this.id + ".update");

      this._setupEvents();
      mendix.lang.nullExec(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
    },

    // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
    enable: function() {
      logger.debug(this.id + ".enable");
    },

    // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
    disable: function() {
      logger.debug(this.id + ".disable");
    },

    // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
    resize: function(box) {
      logger.debug(this.id + ".resize");
      this._hideContextMenu();
    },

    // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
    uninitialize: function() {
      logger.debug(this.id + ".uninitialize");
      // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
    },

    // We want to stop events on a mobile device
    _stopBubblingEventOnMobile: function(e) {
      logger.debug(this.id + "._stopBubblingEventOnMobile");
      if (typeof document.ontouchstart !== "undefined") {
        dojoEvent.stop(e);
      }
    },

    // Attach events to HTML dom elements
    _setupEvents: function() {
      logger.debug(this.id + "._setupEvents");

      this.connect(this.mxform, "onNavigation", function() {
        if (/Trident/i.test(navigator.userAgent)){
          return;
        }
        this._findToolbar();

        //Connect the handler to replace the browser contextmenu with our own when applicable
        this.connect(document, "contextmenu", dojoLang.hitch(this, function(e){
          if (this._clickOnDatagrid(e)) {
            e.preventDefault();
            this._showContextMenu(e);
          } else {
            this._hideContextMenu();
          }
        }));

        //Connect the handler to hide our own contextmenu when the user clicks outside of it
        this.connect(document, "click", dojoLang.hitch(this, function(e){
          if (!dojoDom.isDescendant(e.target, this.contextMenuList)){
            this._hideContextMenu();
          }
        }));
      });

    },

    //Find the Mx Toolbar that we're going to extend
    _findToolbar: function() {
      logger.debug(this.id + "._findToolbar");

      this._dataGrid = dojoQuery(this.datagridIdentifier);
      this._buttons = dojoQuery(this.datagridIdentifier + " .mx-grid-toolbar .mx-button");
      if (this._buttons.length > 0 && this._contextMenuReady !== true) {
        this._buildContextMenu();
      } else if (this._contextMenuReady === true){
        logger.debug(this.id + "._findToolbar >> skipping _buildContextMenu because it's already built.")
      } else {
        console.log(this.id + " toolbar for " + this.datagridIdentifier + " not found");
      }
    },

    //Build the context menu HTML
    _buildContextMenu: function() {
      logger.debug(this.id + "._buildContextMenu");

      dojoArray.forEach(this._buttons, dojoLang.hitch(this, function(button){
        if (!dojoClass.contains(button, this.buttonsExclude)) {
          var popUpButton = dojoConstruct.create("li", {
            innerHTML: button.innerHTML
          }, this.contextMenuList);
          this.connect(popUpButton, "click", function(e){
            this._hideContextMenu();
            button.click();
          });
          if (this.removeLabels === true){
            var span = dojoQuery('span', button)[0];
            if (button.title.length == 0){
              button.title = button.innerHTML.replace(/.*<\/span> */, '');
            }
            dojoConstruct.empty(button);
            dojoConstruct.place(span, button);
          }
        }
      }));
      this._contextMenuReady = true;
    },

    //Check if click happened in our datagrid-body or not
    _clickOnDatagrid: function(e) {
      logger.debug(this.id + "._clickOnDatagrid");
      var
        datagridBody = dojoQuery('.mx-grid-content', this._dataGrid[0]);
      return dojoDom.isDescendant(e.target, datagridBody[0]);
    },

    //Show the context-menu to the user
    _showContextMenu: function(e) {
      logger.debug(this.id + "._showContextMenu");
      var
        activeRow = dojoQuery('.mx-grid-content .selected', this._dataGrid[0]),
        parentPosition = dojoGeometry.position(this.contextMenuParent),
        posLeft = e.clientX - parentPosition.x,
        posTop = e.clientY - parentPosition.y;

      if (activeRow == null || !dojoDom.isDescendant(e.target, activeRow[0])){
        e.target.click();
      }

      dojoGeometry.normalizeEvent(e);
      dojoStyle.set(this.contextMenuList, 'left', posLeft + 'px');
      dojoStyle.set(this.contextMenuList, 'top', posTop + 'px');
      dojoClass.add(this.contextMenuList, 'active');
    },

    //Hide the context-menu from the user
    _hideContextMenu: function() {
      logger.debug(this.id + "._hideContextMenu");
      dojoClass.remove(this.contextMenuList, 'active');
    }
  });
});

require(["DatagridContextMenu/widget/DatagridContextMenu"]);
