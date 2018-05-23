// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

/**
 * @fileoverview Moodle mobile html widgets lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile html widgets functionality.
 */
MM.widgets = {

    eventsRegistered: {},

    render: function(elements) {
        var settings = [];
        var output = "";

        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }

        $.each(settings, function(index, setting) {
            var renderer = "render" + setting.type.charAt(0).toUpperCase() + setting.type.slice(1);
            if (typeof MM.widgets[renderer] != "undefined") {
                output += "<div class=\"mm-setting\">" + MM.widgets[renderer](setting) + "</div>";
            }
        });

        return output;
    },

    renderList: function(elements) {
        var settings = [];
        var output = '<ul class="nav nav-v">';

        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }

        $.each(settings, function(index, setting) {
            var renderer = "render" + setting.type.charAt(0).toUpperCase() + setting.type.slice(1);
            if (typeof MM.widgets[renderer] != "undefined") {
                output += '<li class="nav-item">' + MM.widgets[renderer](setting) + '</li>';
            }
        });

        output += "</ul>";

        return output;
    },

    renderCheckbox: function(el) {
        if (el.checked) {
            el.checked = 'checked = "checked"';
        } else {
            el.checked = '';
        }
        var tpl = '<div class="checkbox-setting-s"><div class="checkbox-label-s"> <%= label %></div><div class="checkbox-tic-s"><input type="checkbox" id="<%= id %>" <%= checked %>/>\
                   <label for="<%= id %>"></label></div></div>';

        return MM.tpl.render(tpl, el);
    },

    renderButton: function(el) {
        if (typeof el.url == "undefined") {
            el.url = "";
        }
        var tpl = '<a href="#<%= url %>" id="<%= id %>"><button><%= label %></button></a>';

        return MM.tpl.render(tpl, el);
    },

    renderSpinner: function(el) {
        var tpl = '\
        <div style="float: right; text-align: right; width: 80px; padding-top: 2px;" id="<%= id %>">\
            <button class="plus"  style="width: 30px; height: 30px; padding: 0px">+</button>\
            <button class="minus" style="width: 30px; height: 30px; padding: 0px; margin-left: 4px">-</button>\
        </div>\
        <div style="margin-right: 80px"><label for="<%= id %>-text"><%= label %></label>\
            <input type="text" value = "'+ MM.getConfig(el.id) +'" id="<%= id %>-text" style="border: 0; color: #f6931f; font-weight: bold;" readonly="readonly"/>\
        </div><div style="clear: both"></div>';

        return MM.tpl.render(tpl, el);
    },

    renderSelect: function(el) {
        var tpl = '\
            <div class="select-setting">\
                <div class="select-label"> <%= label %></div>\
                <div class="select-field">\
                    <select name="<%= id %>" id="<%= id %>">\
                    <% for (var el in options) { %>\
                        <% if (el == selected) { %>\
                        <option value="<%= el %>" selected="selected"><%= options[el]%></option>\
                        <% } else { %>\
                        <option value="<%= el %>"><%= options[el]%></option>\
                        <% }  %>\
                    <% } %>\
                    </select>\
                </div>\
            </div>\
        ';

        return MM.tpl.render(tpl, el);
    },

    /**
     * Renders a modal with an iframe.
     * @param  {String} title Title to show in the modal.
     * @param  {String} path  iframe's source.
     */
    renderIframeModal: function(title, path) {
        var height = $(window).height() - 200;
        var iframestyle = 'border: none; width: 100%; height: 100%';
        var iframe = '<iframe id="page-view-iframe" style="' + iframestyle + '" src="' + path + '">';
        iframe += '</iframe>';
        var divstyle = 'overflow-y: scroll; -webkit-overflow-scrolling: touch; height: ' + height + 'px';
        var content = '<div style="' + divstyle + '">' + iframe + '</div>';

        var options = {
            title: title,
            width: "100%",
            marginTop: "10px"
        };
        MM.widgets.dialog(content, options);

        MM.handleExternalLinks('.modalHeader a[target="_blank"]');

        $("#dialog-close").on(MM.clickType, function(e){
            MM.widgets.dialogClose();
        });

        // Handle external links inside the iframe.
        setTimeout(function() {
            $('#page-view-iframe').contents().find('a').click(function(e) {
                var href = $(this).attr('href');
                if (href.indexOf("http") > -1) {
                    e.preventDefault();
                    window.open(href, '_blank');
                }
            });
        }, 1000);

    },


    renderIframeModule: function(title, path) {
        var height = $(window).height();
	var percentHeight = parseInt(((height - 40) / height)*100);
	var iframestyle = 'border: none; width: 100%; height: '+percentHeight+'%';
        var iframe = '<iframe id="page-view-iframe" style="' + iframestyle + '" src="' + path + '" onload="resizeIframe();">';
        iframe += '</iframe>';
        var divstyle = 'height:100%;width:100%';
        var onloadScript = '<script type="text/javascript">';
        onloadScript+= 'function resizeIframe(){'
        onloadScript+= 'var iframe = document.getElementById("page-view-iframe");'
        onloadScript+= 'if(iframe.contentDocument && iframe.contentDocument.body){';
        onloadScript+= 'iframe.style.height = (iframe.contentDocument.body.offsetHeight - 0) + "px";';
        onloadScript+= 'iframe.style.width = iframe.contentDocument.body.offsetWidth + "px";';
        onloadScript+= '}}</script>';
        var content = onloadScript + '<div style="' + divstyle + '"><div style="background-color:#154284;border:0;border-radius:0;display: table; width: 100%;height: 40px;"><div id="dialog-close" style="display: table-cell; text-align: right;padding-right:10px;color:white;padding-top:10px;float:right">X</div></div>' + iframe + '</div>';

        $('#app-dialog').html(content);

        $("#app-dialog").css('display', 'block');
        $("#app-dialog").css('opacity', '1');
        // Allow mouse events in this div.
        $("#app-dialog").css('pointer-events', 'auto');

        $("#dialog-close").on(MM.clickType, function(e){
            $("#app-dialog").css('opacity', '0');
            $("#app-dialog").css('display', 'none');
            // No mouse events in this div.
            $("#app-dialog").css('pointer-events', 'none');
            $('#app-dialog').html('<div><div class="modalHeader"></div><div class="modalContent"></div><div class="modalFooter"></div><div class="modalClear"></div></div>');
        });


    },

     /**
     * Renders a modal with an iframe injecting html content.
     * @param  {String} title Title to show in the modal.
     * @param  {String} content  iframe's content.
     */
    renderIframeModalContents: function(title, html) {

        var height = $(window).height() - 200;
        var iframestyle = 'border: none; width: 100%; height: 100%';
        var iframe = '<iframe id="page-view-iframe" style="' + iframestyle + '">';
        iframe += '</iframe>';
        var divstyle = 'overflow-y: scroll; -webkit-overflow-scrolling: touch; height: ' + height + 'px';
        var content = '<div style="' + divstyle + '">' + iframe + '</div>';

        var options = {
            title: title,
            width: "100%",
            marginTop: "10px"
        };
        MM.widgets.dialog(content, options);

        MM.handleExternalLinks('.modalHeader a[target="_blank"]');

        $("#dialog-close").on(MM.clickType, function(e){
            MM.widgets.dialogClose();
        });

        // Inject the HTMl inside the iframe.
        var iframe = $('#page-view-iframe');
        iframe.ready(function() {
            iframe.contents().find("body").append(html);
        });

        // Handle external links inside the iframe.
        setTimeout(function() {
            iframe.contents().find('a').click(function(e) {
                var href = $(this).attr('href');
                if (href.indexOf("http") > -1) {
                    e.preventDefault();
                    window.open(href, '_blank');
                }
            });
        }, 1000);

    },

    enhanceButton: function(id) {
        //$("#" + id).button();
    },

    enhanceCheckbox: function(id) {
        //$("#" + id).parent().addClass("checkbox-tic");
    },

    enhanceSpinner: function(id, config) {
        // Nothing.
        $("#" + id + " .plus" ).click(config.clickPlus);
        $("#" + id + " .minus").click(config.clickMinus);
    },

    enhance: function(elements) {
        var settings = [];
        var output = "";

        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }

        $.each(settings, function(index, setting) {
            var enhancer = "enhance" + setting.type.charAt(0).toUpperCase() + setting.type.slice(1);
            if (typeof MM.widgets[enhancer] != "undefined") {
                if (setting.config) {
                    MM.widgets[enhancer](setting.id, setting.config);
                } else {
                    MM.widgets[enhancer](setting.id);
                }
            }
        });
        //MM.widgets.improveCheckbox();
    },

    addHandlers: function(elements) {
        var settings = [];
        var output = "";

        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }

        $.each(settings, function(index, setting) {
            if (typeof setting.handler != "undefined") {
                var fn = setting.handler;
                var eHandler = function(e){
                    fn(e, setting);
                };
                if (setting.type == "select") {
                    $("#" + setting.id).on('change', eHandler);
                } else {
                    $("#" + setting.id).bind(MM.clickType, eHandler);
                }
                MM.widgets.eventsRegistered["#" + setting.id] = eHandler;
            }
        });
    },

    dialog: function(text, options) {
        if (!options) {
            options = {
                title: "",
                autoclose: 0
            };
            options.buttons[MM.lang.s('close')] = MM.widgets.dialogClose;
        }
        if (!options.buttons) {
            options.buttons = {};
            options.buttons[MM.lang.s('close')] = MM.widgets.dialogClose;
        }
        $("#app-dialog .modalHeader, #app-dialog .modalContent, #app-dialog .modalFooter").html("");

        $("#app-dialog .modalHeader").html(options.title);
        $("#app-dialog .modalContent").html(text);

        if (options.buttons) {
            var buttons = "";
            // If options.buttons == {} then it's true, but els won't be
            // incremented. So a value of 1 is needed to avoid a div by
            // 0 error later.
            var els = 1;
            $.each(options.buttons, function (key, value) {
                if (options.buttons[key]['style'])
                    buttons += "<button class=\"" + options.buttons[key]['style'] + "\" style=\"width: _width_%\"> " + key + " </button>";
                else
                    buttons += "<button class=\"modal-button-" + els + "\" style=\"width: _width_%\"> " + key + " </button>";
                els++;
            });
            var width = 100 / els;
            buttons = buttons.replace(/_width_/ig, width);
            $("#app-dialog .modalFooter").html(buttons);

            // Handlers for buttons.
            // Els starts at 1 so that the buttons above have the
            // correct handlers attached to them.
            els = 1;
            $.each(options.buttons, function (key, value) {
                if (options.buttons[key]['style']) {
                    $("." + options.buttons[key]['style']).click(function(e) {
                    //$(this).click(function(e) {
                        value();
                    });
                } else {
                    $(".modal-button-" + els).click(function(e) {
                    //$(this).click(function(e) {
                        value();
                    });
                }
                els++;
            });
        }

        if (options.width) {
            $("#app-dialog > div").css('width', options.width);
        } else {
            if (MM.deviceType != 'phone') {
                var newWidth = $(document).innerWidth() / 2;
                $("#app-dialog > div").css('width', newWidth);
            }
        }

        

        // Show the div.
        $("#app-dialog").css('display', 'block');
        $("#app-dialog").css('opacity', '1');
        // Allow mouse events in this div.
        $("#app-dialog").css('pointer-events', 'auto');
        
        if (options.marginTop) {
            $("#app-dialog > div").css('margin-top', options.marginTop);
        } else {
            MM.log('window:'+$(window).height()+'/'+$(window).width()+'/'+$("#app-dialog > div").height());
            var marge = ($(window).height() - $("#app-dialog > div").height())/2;
            $("#app-dialog > div").css('margin-top', marge+'px');
        }
        
        if (options.autoclose) {
            setTimeout(function() {
                MM.widgets.dialogClose();
            }, options.autoclose);
        }
    },
    
    dialog2: function(text, options) {
        if (!options) {
            options = {
                title: "",
                autoclose: 0
            };
            options.buttons[MM.lang.s('close')] = MM.widgets.dialogClose2;
        }
        if (!options.buttons) {
            options.buttons = {};
            options.buttons[MM.lang.s('close')] = MM.widgets.dialogClose2;
        }
        $("#app-dialog2 .modalHeader, #app-dialog2 .modalContent, #app-dialog2 .modalFooter").html("");

        $("#app-dialog2 .modalHeader").html(options.title);
        $("#app-dialog2 .modalContent").html(text);

        if (options.buttons) {
            var buttons = "";
            // If options.buttons == {} then it's true, but els won't be
            // incremented. So a value of 1 is needed to avoid a div by
            // 0 error later.
            var els = 1;
            $.each(options.buttons, function (key, value) {
                if (options.buttons[key]['style'])
                    buttons += "<button class=\"" + options.buttons[key]['style'] + "\" style=\"width: _width_%\"> " + key + " </button>";
                else
                    buttons += "<button class=\"modal-button-" + els + "\" style=\"width: _width_%\"> " + key + " </button>";
                els++;
            });
            var width = 100 / els;
            buttons = buttons.replace(/_width_/ig, width);
            $("#app-dialog2 .modalFooter").html(buttons);

            // Handlers for buttons.
            // Els starts at 1 so that the buttons above have the
            // correct handlers attached to them.
            els = 1;
            $.each(options.buttons, function (key, value) {
                if (options.buttons[key]['style']) {
                    $("." + options.buttons[key]['style']).click(function(e) {
                    //$(this).click(function(e) {
                        value();
                    });
                } else {
                    $(".modal-button-" + els).click(function(e) {
                    //$(this).click(function(e) {
                        value();
                    });
                }
                els++;
            });
        }

        if (options.width) {
            $("#app-dialog2 > div").css('width', options.width);
        } else {
            if (MM.deviceType != 'phone') {
                var newWidth = $(document).innerWidth() / 2;
                $("#app-dialog2 > div").css('width', newWidth);
            }
        }

        

        // Show the div.
        $("#app-dialog2").css('display', 'block');
        $("#app-dialog2").css('opacity', '1');
        // Allow mouse events in this div.
        $("#app-dialog2").css('pointer-events', 'auto');
        
        if (options.marginTop) {
            $("#app-dialog2 > div").css('margin-top', options.marginTop);
        } else {
            MM.log('window:'+$(window).height()+'/'+$(window).width()+'/'+$("#app-dialog2 > div").height());
            var marge = ($(window).height() - $("#app-dialog2 > div").height())/2;
            $("#app-dialog2 > div").css('margin-top', marge+'px');
        }
        
        if (options.autoclose) {
            setTimeout(function() {
                MM.widgets.dialogClose2();
            }, options.autoclose);
        }
    },

    dialogClose: function() {
        // Hide the div.
        $("#app-dialog").css('opacity', '0');
        $("#app-dialog").css('display', 'none');
        // No mouse events in this div.
        $("#app-dialog").css('pointer-events', 'none');
    },
    
    dialogClose2: function() {
        // Hide the div.
        $("#app-dialog2").css('opacity', '0');
        $("#app-dialog2").css('display', 'none');
        // No mouse events in this div.
        $("#app-dialog2").css('pointer-events', 'none');
    },

    // TODO: Never called - consider removing?
    improveCheckbox: function() {
        var onClass = "ui-icon-circle-check", offClass = "ui-icon-circle-close";

        $( "input:checked[type=checkbox] " ).button({ icons: {primary: onClass} });
        $( "input[type=checkbox]:not(:checked)" ).button({ icons: {primary: offClass} });

        $( "input[type=checkbox]" ).bind(MM.clickType, function(){

            var swap = function(me, toAdd, toRemove) {
                // find the LABEL for the checkbox
                // ... which should be _immediately_ before or after the checkbox
                var node = me.next();

                // and swap
                node.children(".ui-button-icon-primary")
                    .addClass(toAdd)
                    .removeClass(toRemove);
                ;
            };

            var me = $(this);
            if (me.is(':checked')) {
                swap($(this), onClass, offClass);
            } else {
                swap($(this), offClass, onClass);
            }
        });
    }
}
