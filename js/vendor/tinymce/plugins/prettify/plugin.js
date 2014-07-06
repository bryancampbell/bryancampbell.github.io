/**
 * http://abricos.org, https://github.com/abricos/tinymce-prettify-plugin
 * @license    Dual licensed under the MIT or GPL Version 3 licenses.
 * @version    0.1
 * @author     Alexander Kuzmin <roosit@abricos.org>
 * @package    TinyMCE
 * @name       prettify
 * GPL 3 LICENCES
 */
(function() {
	tinymce.create('tinymce.plugins.prettify', {
		init : function(ed, url) {
			var t = this;

			t.editor = ed;
			ed.addCommand('mceprettify', function() {
	            ed.windowManager.open({
	                title: 'Insert code using Prettify syntax highlighter',
	                body: [
	                    {type: 'checkbox', name: 'prettify_linenums', label: 'Line numbering', default: 1},
	                    {type: 'listbox', name: 'prettify_language', label: 'Choose Language', 
	                    	values: [
	                    	         {text:"Default", value:""},
	                    	         {text:"CSS", value:"css"},
	                    	         {text:"HTML", value:"html"},
	                    	         {text:"Java", value:"java"},
	                    	         {text:"Javascript", value:"javascript"},
	                    	         {text:"PHP", value:"php"},
	                    	         {text:"Scala", value:"scala"},
	                    	         {text:"SQL", value:"sql"},
	                    	         {text:"XML", value:"xml"}
	                    	]
	                    },
	                    
	                    {type: 'label', text:"Paste your code below:"},
	                    {type: 'textbox', flex:1, name: 'prettify_code', multiline:1, style:'height:270px;'}
	                ],
					width : 450 + parseInt(ed.getLang('prettify.delta_width', 0)),
					height : 400 + parseInt(ed.getLang('prettify.delta_height', 0)),
	                onsubmit: function(e) {
	                	console.log(e.data);
	                	var options = '';
	                	if(e.data.prettify_linenums) {
	              		  options += ' linenums';
	              		}
	                	if (e.data.prettify_language.value != ''){
	              			options += ' lang-'+e.data.prettify_language;
	              		}
	              		var oCode = '<pre class="prettyprint'+options+'">';
	              		oCode +=  tinymce.DOM.encode(e.data.prettify_code);
	              		oCode += '</code></pre> ';
	                    oCode += '<p>&nbsp;</p>';
	                    // Insert content when the window form is submitted
	                    ed.insertContent(oCode);
	                }
	            });

				
			});

			ed.addButton('prettify', {
				title : 'prettify.desc',
				cmd : 'mceprettify',
				image : url + '/img/prettify.png',
				onPostRender: function() {
			        var ctrl = this;
			 
			        ed.on('NodeChange', function(e) {
			            ctrl.active(e.element.nodeName == 'IMG');
			        });
			    }
			});

			ed.on('init', function(ed) {
				tinymce.DOM.loadCSS(url + '/css/codeditor.css');
            });

	        if (tinymce.isIE || tinymce.isWebKit){
	        	ed.on('keydown', function(e) {
	                var brElement;
	                var selection = ed.selection;
	
	                if (e.keyCode == 13 && selection.getNode().nodeName === 'CODE') {
	                    selection.setContent('<br id="__prettify" /> ', {format : 'raw'}); // Do not remove the space after the BR element.
	
	                    brElement = ed.dom.get('__prettify');
	                    brElement.removeAttribute('id');
	                    selection.select(brElement);
	                    selection.collapse();
	                    return tinymce.dom.Event.cancel(e);
	                }
	            });
	        }
	
	        if (tinymce.isGecko || tinymce.isOpera) {
	        	ed.on('keydown', function(e) {
	                var selection = ed.selection;
	                
	                if (e.keyCode == 9 && selection.getNode().nodeName === 'CODE') {
	                    selection.setContent('\t', {format : 'raw'});
	                    return tinymce.dom.Event.cancel(e);
	                }
	            });
	        }
	
	        if (tinymce.isGecko) {
	        	ed.on('SetContent', function(e) {
	        		//console.log('SetContent event', e);
	                t._replaceNewlinesWithBrElements(ed);
	            });
	        }
	
	        ed.on('PreProcess', function(e) {
	            t._replaceBrElementsWithNewlines(ed, e.node);
	
	            if (tinymce.isWebKit){
	                t._removeSpanElementsInPreElementsForWebKit(ed, e.node);
	            }
	
	            var el = ed.dom.get('__prettifyFixTooltip');
	            ed.dom.remove(el);
	        });
	    },
	
	    _nl2br: function( strelem ) {
	        var t = this;
	        //Redefined the espace and unescape function
	
	        if(!(t.escape && t.unescape)) {
	            var escapeHash = {
	                '_' : function(input) {
	                    var ret = escapeHash[input];
	                    if(!ret) {
	                        if(input.length - 1) {
	                            ret = String.fromCharCode(input.substring(input.length - 3 ? 2 : 1));
	                        }
	                        else {
	                            var code = input.charCodeAt(0);
	                            ret = code < 256
	                                ? "%" + (0 + code.toString(16)).slice(-2).toUpperCase()
	                                : "%u" + ("000" + code.toString(16)).slice(-4).toUpperCase();
	                        }
	                        escapeHash[ret] = input;
	                        escapeHash[input] = ret;
	                    }
	                    return ret;
	                }
	            };
	            t.escape = t.escape || function(str) {
	                return str.replace(/[^\w @\*\-\+\.\/]/g, function(aChar) {
	                    return escapeHash._(aChar);
	                });
	            };
	            t.unescape = t.unescape || function(str) {
	                return str.replace(/%(u[\da-f]{4}|[\da-f]{2})/gi, function(seq) {
	                    return escapeHash._(seq);
	                });
	            };
	        }
	        strelem = t.escape(strelem);
	        var newlineChar;
	
	        if(strelem.indexOf('%0D%0A') > -1 ){
	            newlineChar = /%0D%0A/g ;
	        } else if (strelem.indexOf('%0A') > -1){
	            newlineChar = /%0A/g ;
	        } else if (strelem.indexOf('%0D') > -1){
	            newlineChar = /%0D/g ;
	        }
	
	        if ( typeof(newlineChar) == "undefined"){
	            return t.unescape(strelem);
	        } else {
	            return t.unescape(strelem.replace(newlineChar, '<br/>'));
	        }
	    },
	
	    _replaceNewlinesWithBrElements: function(ed) {
	        var t = this;
	        
	        var preElements = ed.dom.select('code');
	        for (var i=0; i<preElements.length; i++) {
	            preElements[i].innerHTML = t._nl2br(preElements[i].innerHTML);
	        }
	    },
	
	     _replaceBrElementsWithNewlines: function(ed, node){
	        var brElements = ed.dom.select('code br', node);
	        var newlineChar = tinymce.isIE ? '\r' : '\n';
	        var newline;
	
	        for (var i=0; i<brElements.length; i++){
	            newline = ed.getDoc().createTextNode(newlineChar);
	
	            ed.dom.insertAfter(newline, brElements[i]);
	            ed.dom.remove(brElements[i]);
	        }
	    },
	
	    _removeSpanElementsInPreElementsForWebKit: function(ed, node){
	        var spanElements = ed.dom.select('code span', node);
	        var space;
	        for (var i=0; i<spanElements.length; i++) {
	            space = ed.getDoc().createTextNode(spanElements[i].innerHTML);
	            ed.dom.insertAfter(space, spanElements[i]);
	            ed.dom.remove(spanElements[i]);
	        }
	    },
		createControl : function(n, cm) {
			return null;
		},
	
		getInfo : function() {
			return {
				longname : 'Code Highlight',
				author : 'Alexander Kuzmin',
				authorurl : 'http://abricos.org',
				infourl : 'http://abricos.org',
				version : "0.1"
			};
		}
	});

	tinymce.PluginManager.add('prettify', tinymce.plugins.prettify);
})();