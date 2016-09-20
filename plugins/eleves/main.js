var templates = [
    "root/externallib/text!root/plugins/eleves/eleves.html",
    "root/externallib/text!root/plugins/eleves/eleve.html",
    "root/externallib/text!root/plugins/eleves/eleves_row.html",
    "root/externallib/text!root/plugins/eleves/countries.json"
];

define(templates,function (elevesTpl, eleveTpl, elevesRowTpl, countriesJSON) {
    var plugin = {
        settings: {
            name: "eleves",
            type: "course",
            menuURL: "#eleves/",
            lang: {
                component: "core"
            },
            icon: ""
        },

        storage: {
            eleve: {type: "model"},
            eleves: {type: "collection", model: "eleve"}
        },

        routes: [
            ["eleves/:courseId", "eleves", "showEleves"],
            ["eleve/:courseId/:userId", "eleves", "showEleve"],
            ["eleve/:courseId/:userId/:popup", "eleves_pop", "showEleve"],
            ["eleve/:courseId/:userId/stop", "eleves", "stopCourse"],
        ],

        limitNumber: 100,
        
        contentsPageRendered: function() {
                    MM.log('Eleve contentsPageRendered');
                    $("#showCourse").on(MM.clickType, function(e) {
                        e.preventDefault();
                        var path = $(this).attr("path");
                        var course = $(this).attr("course");
                        var user = $(this).attr("user");
                        var fileResult = MM.config.current_site.id+"/"+course+"/result/"+user+".json";
                        MM.log('click start:'+path+','+fileResult);
                        
                        //create local result file
                        MM.fs.createFile(fileResult,
                            function(fileEntry) {
                                var d = new Date();
                                var content = '{"starttime":"'+d.getTime()+'"}';
                                MM.log('Create Result :'+content);
                                MM.fs.writeInFile(fileEntry, content, 
                                    function(fileUrl) {
                                        MM.log('Write Result :'+fileUrl);
                                        $('#stopCourse').show();
                                    },
                                    function(fileUrl) {
                                        MM.log('Write Result NOK:'+content);
                                    }
                                    
                                );
                            },   
                                
                            function(fileEntry) {
                               MM.log('Create Result : NOK');
                            }
                        );
                    
                        //launch offline course
                        MM.plugins.resource._showResource(path);
                    });
                    
                    
                    
                    
                    
                    
                    
        },
        
        
        
        
        stopCourse: function(courseId, userId) {
            //var addNote = MM.lang.s("addnote");
            var addNote = "Ajouter";

            var options = {
                title: 'Ajouter une note',
                width: "90%",
                buttons: {}
            };

            options.buttons[addNote] = function() {

                var data = {
                    "notes[0][userid]" : userId,
                    "notes[0][publishstate]": 'personal',
                    "notes[0][courseid]": courseId,
                    "notes[0][text]": $("#addnotescore").val(),
                    "notes[0][format]": 1
                };
                
                var score = $("#addnotescore").val();
                var resultFile =  MM.config.current_site.id + "/" + courseId + "/result/" + userId + ".json";
                var message = "Note Enregistrée.";
                
                MM.fs.findFileAndReadContents(resultFile,
                  function (result) {
                    MM.log('Result OK :'+result);
                    var d = new Date();
                    var lenghto = result.length - 1;
                    var content = result.substr(0, lenghto) + ',"endtime":"'+d.getTime()+'","note":"'+score+'"}';
                    MM.log('Create Result :'+content);
                    var fileResult = MM.config.current_site.id+"/"+courseId+"/result/"+userId+".json";
                    
                    
                    //create local result file
                    MM.fs.createFile(fileResult,
                        function(fileEntry) {
                             MM.fs.writeInFile(fileEntry, content, 
                                function(fileUrl) {
                                    MM.log('Write Result OK:'+fileUrl);
                                    $('#stopCourse').hide();
                                    $("#synchroR").show();
                                    message = "Note Enregistrée.";
                                    
                                },
                                function(fileUrl) {
                                    MM.log('Write Result NOK:'+content);
                                    message = "Problème lors de l'écriture.Veuillez Réessayer.";
                                }
                                
                            );
                        },   
                            
                        function(fileEntry) {
                           MM.log('Create Result : NOK');
                           message = "Problème lors de l'écriture.Veuillez Réessayer.";
                        }
                    );
                  },
                  function(result) {
                    MM.log('Result NOK :'+result+','+resultFile);
                    message = "Problème lors de l'écriture.Veuillez Réessayer.";
                  }
                );
                
                MM.widgets.dialogClose();
                MM.popMessage(message, {title:'Ajouter une note', autoclose: 5000, resizable: false});
                MM.Router.navigate("eleve/" + courseId + "/" + userId);
                
            };
            
            options.buttons[MM.lang.s("cancel")] = function() {
                MM.Router.navigate("eleve/" + courseId + "/" + userId);
                MM.widgets.dialogClose();
            };

            

            var html = '\
            <input type="text" id="addnotescore" name="addnotescore" value=""> %\
            ';

            MM.widgets.dialog(html, options);
        },
        
        showEleves: function(courseId) {
            MM.panels.showLoading('center');

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }
            // Adding loading icon.
            $('a[href="#eleves/' +courseId+ '"]').addClass('loading-row');
            
            

            MM.plugins.eleves._loadEleves(courseId, 0, MM.plugins.eleves.limitNumber,
                function(users) {
                    // Removing loading icon.
                    $('a[href="#eleves/' +courseId+ '"]').removeClass('loading-row');
                    
                    
                    var showMore = true;
                    if (users.length < MM.plugins.eleves.limitNumber) {
                        showMore = false;
                    }

                    MM.plugins.eleves.nextLimitFrom = MM.plugins.eleves.limitNumber;
                    /*
                    $.each(users, function( index, value ) {
                        var resultFile =  MM.config.current_site.id + "/" + courseId + "/result/" + value.id + ".json";
                        MM.fs.findFileAndReadContents(resultFile,
                            function (result) {
                                MM.log('Load Result : OK' + result);
                                $("#synchroR").show();
                            },
                            function (result) {
                                MM.log('Load Result : NOK' + result);
                            }
                        );
                    });
                    */
                    
                    var localCourses = MM.db.where('contents', {'courseid':courseId, 'site':MM.config.current_site.id});
                    MM.log('LocalCourses:'+localCourses+','+localCourses.length);
                    var modulesL = [];
                    
                    if (localCourses) {
                        
                        
                        $('#offlineC').html('<option value="0">Sélectionner un cours</option>')
                        
                        $.each(localCourses, function( index, value ) {
                            var localCourse = value.toJSON();
                            if (localCourse.contents) {
                                var localFile = localCourse.contents[0];
                                var localContentId = localCourse.url.split("?id=");
                                var localPathCourse = MM.plugins.contents.getLocalPaths2(courseId, localContentId[1], localFile);
                                modulesL.push(localContentId[1]);
                                
                                MM.fs.fileExists(localPathCourse.file,
                                    function(path) {
                                        
                                        var localPathOffline = MM.fs.getRoot() + '/' + localPathCourse.file;
                                        MM.log('offline LocalCourse:'+localPathOffline+' exist');
                                        
                                        $('#offlineC').append($('<option>', { 
                                            value: localPathOffline + ',' + localContentId[1],
                                            text : localCourse.name 
                                        }));
                                        //$('#offlineC').show();
                                        
                                    
                                    },
                                    function(path) {
                                       MM.log('offline LocalCourse:'+localPathCourse.file+' Not exist');
                                    }
                                );
                            }
                        });
                    }
                    
                    var sessionFile =  MM.config.current_site.id + "/" + courseId + "/result/session.json";
                    MM.log('json session :'+sessionFile);
                    
                    var myusers = users;
                    MM.log('myusers.length:'+myusers.length);
                    
                    MM.fs.findFileAndReadContents(sessionFile,
                        function (result) {
                            MM.log('Load Session : OK' + result);
                            var obj = JSON.parse(result);
                            var users = obj.users.split(",");
                            
                            $.each(users, function(index, user) {
                                $('input:checkbox').each(function() {
                                    MM.log('User:'+user+'/Checkbox:'+parseInt($(this).val())+'/id:'+$(this).attr('id'));
                                    if ($(this).val() == user) {
                                        $(this).prop("checked", true );
                                        MM.log('myusers.length:'+myusers.length);
                                        myusers = $.grep(myusers, function( el ) {
                                            return el.id !== user;
                                        });
                                        MM.log('myusers.length:'+myusers.length);
                                        var objectWithEvents = $("ul#listeparticipants1 li[eleve='"+$(this).attr('id')+"']").detach();
                                        $('ul#listeparticipants2').append(objectWithEvents);
                                        
                                    }
                                    //$(this).attr("disabled", true );
                                });
                            });
                            
                            
                            $('#showSessionL').hide();
                            $('#offlineC').show();
                            $('#showCourseL').hide();
                            $('#stopCourseL').hide();
                            $('#stopSessionL').show();      
                            //$('#synchroR').hide();
                            $('#showSessionL').attr('users',users);
                            $('#showCourseL').attr('users',users);
                            $('#stopCourseL').attr('users',users);
                            $('#stopSessionL').attr('users',users);
                            $('#stopSessionL').attr('starttime',obj.starttime);
                            
                            
                        },
                        function (result) {
                            MM.log('Load Session : NOK' + result);
                            if ($('#offlineC option').length>1) {    
                                $('input:checked').each(function() {
                                    $('#showSessionL').show();
                                });
                            }
                            
                            $('#offlineC').hide();
                            $('#showCourseL').hide();
                            $('#stopCourseL').hide();
                            $('#stopSessionL').hide();      
                            //$('#synchroR').hide();
                        }
                    );
                    
                    
                    
                    var directoryResult = MM.config.current_site.id + "/" + courseId + "/result/";
                    MM.fs.getDirectoryContents(directoryResult,
                        function(entries) {

                            if(entries.length > 0) {
                                
                                $.each(entries, function(index, entry) {
                                    
                                    MM.log('Session Stockée:'+entry.name);
                                    var name = entry.name.split("session_");
                                    if (name[1]) {
                                        $("#synchroR").show();
                                    }
                                    
                                    var namefile = entry.name.split(".");
                                    if (!isNaN(namefile[0])) {
                                    
                                        var moduleFile =  MM.config.current_site.id + "/" + courseId + "/result/" + entry.name;
                                
                                        MM.fs.findFileAndReadContents(moduleFile,
                                            function (resultModule) {
                                                var obj = JSON.parse(resultModule);
                                                if (!obj.endtime) {
                                                    
                                                     $('#showSessionL').hide();
                                                     $('#offlineC').hide();
                                                     $('#showCourseL').hide();
                                                     $('#stopCourseL').show();
                                                     $('#stopSessionL').hide();
                                                     
                                                     $("#stopCourseL").attr("module",namefile[0]);
                                                }
                                            }
                                        );
                                    }
                                });
                            }
                            
                        },
                        function() {
                            //
                        }
                    );
                    
                    
                    
                    var tpl = {
                        users: users,
                        deviceType: MM.deviceType,
                        courseId: courseId,
                        showMore: showMore
                    };
                    var html = MM.tpl.render(MM.plugins.eleves.templates.eleves.html, tpl);

                    var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
                    var pageTitle = "";

                    if (course) {
                        pageTitle = course.get("shortname");
                    }

                    MM.panels.show('right', html, {title: pageTitle});

                    // Load the first user
                    if (MM.deviceType == "tablet" && users.length > 0) {
                        $("#panel-center li:eq(0)").addClass("selected-row");
                        //MM.plugins.eleves.showEleve(courseId, users.shift().id);
                        $("#panel-center li:eq(0)").addClass("selected-row");
                    }

                    // Save the users in the users table.
                    var newUser;
                    users.forEach(function(user) {
                        newUser = {
                            'id': MM.config.current_site.id + '-' + user.id,
                            'userid': user.id,
                            'fullname': user.fullname,
                            'profileimageurl': user.profileimageurl,
                            'notes':user.notes
                        };
                        var checkUser = MM.db.get('users', MM.config.current_site.id + "-" + user.id);
                        if (checkUser) {
                            var checkUserJ = checkUser.toJSON();
                            newUser.pif = checkUserJ.pif;
                        } else {
                            newUser.pif = user.pif;
                        }
                        MM.db.insert('users', newUser);
                    });
                    
                    

                    // Show more button.
                    $("#eleves-showmore").on(MM.clickType, function(e) {
                        var that = $(this);
                        $(this).addClass("loading-row-black");

                        MM.plugins.eleves._loadEleves(
                            courseId,
                            MM.plugins.eleves.nextLimitFrom,
                            MM.plugins.eleves.limitNumber,
                            function(users) {
                                that.removeClass("loading-row-black");
                                MM.plugins.eleves.nextLimitFrom += MM.plugins.eleves.limitNumber;

                                var tpl = {courseId: courseId, users: users};
                                var newUsers = MM.tpl.render(MM.plugins.eleves.templates.elevesRow.html, tpl);
                                $("#eleves-additional").append(newUsers);
                                if (users.length < MM.plugins.eleves.limitNumber) {
                                    that.css("display", "none");
                                }
                                
                    
                            },
                            function() {
                                that.removeClass("loading-row-black");
                            }
                        );
                    });
                    
                    //Synchro Button
                    $("#synchroR").on(MM.clickType, function(e) {
                        
                        var lenghto = $(this).attr('users').length - 1;
                        var userList = $(this).attr('users').substr(0, lenghto);
                        var users = userList.split(",");
                        var lenghton = $(this).attr('names').length - 1;
                        var namesList = $(this).attr('names').substr(0, lenghton);
                        var names = namesList.split(",");
                        var course = $(this).attr('course');
                        var message = "";
                        var on = $(this).attr('on');
                        var btnSynchro = $(this);
                        MM.log("Synchro Start");
                        
                        
                        if (on == undefined || on == "off") {
                            $(this).attr('on','on');
                            MM.log('Synchro On:'+on+','+$(this).attr('on'));
                            var directoryResult = MM.config.current_site.id + "/" + courseId + "/result/";
                            MM.fs.getDirectoryContents(directoryResult,
                                function(entries) {
        
                                    if(entries.length > 0) {
                                        
                                        $.each(entries, function(index, entry) {
                                            MM.log('File:'+entry.name);
                                            
                                            var name = entry.name.split("session_");
                                            if (name[1]) {
                                                var sessionFile =  MM.config.current_site.id + "/" + course + "/result/" + entry.name;
                                                MM.fs.findFileAndReadContents(sessionFile,
                                                    function(result) {
                                                        MM.log( "Session File OK:" + sessionFile);
                                                        var obj = JSON.parse(result);
                                                        var modulesId = obj.modulesId.split(",");
                                                        var modulesName = "";
                                                        var users = obj.users.split(",");
                                                        var indexU=1;
                                                        var pifscourse = new Array();
                                                        //Get Pifs
                                                        $.each(users, function( indexU1, valueU1 ) {
                                                            var userspif = MM.db.where('users', {userid:parseInt(valueU1)});
                                                            var userpif = userspif[0].toJSON();
                                                            var pifs = userpif.pif;
                                                            if (!pifs) {
                                                                pifs = '[]';
                                                            }
                                                            pifscourse[indexU1] = $.grep(pifs, function( el ) {
                                                                            return el.courseid == course;
                                                            });
                                                        });
                                                        
                                                        var pifscoursejson = JSON.stringify(pifscourse);
                                                        
                                                        MM.log("pifs synchro:"+pifscourse.length);
                                                             
                                                        var data = {
                                                            "userid" : obj.users,
                                                            "moduleid" : obj.modulesId,
                                                            "courseid" : course,
                                                            "starttime" : obj.starttime,
                                                            "endtime" : obj.endtime,
                                                            "modulesstart" : obj.modulesStart,
                                                            "modulesend" : obj.modulesEnd,
                                                            "managerid" : MM.site.get('userid'),
                                                            "pifs" : pifscoursejson
                                                        }
                                        
                                                        MM.widgets.dialogClose();
                                                                       
                                                        MM.moodleWSCall('local_mobile_update_report_completion_by_userid_courseid', data,
                                                            function(status){
                                                                var sessionTime = new Date(parseInt(obj.starttime));
                                                                var sessionDate = sessionTime.getDate()+"/"+(sessionTime.getMonth()+1)+"/"+sessionTime.getFullYear()+" "+sessionTime.getHours()+":"+sessionTime.getMinutes();
                                                                var participants_users = status.participants_user.split(",");
                                                                var participants_id = status.participants_id.split(",");
                                                                
                                                                
                                                                $.each(participants_users, function( indexU, valueU ) {
                                                                    
                                                                    var signatureFile = directoryResult + valueU + '_' + obj.starttime + '.png';
                                                                    var signatureRelFile =  MM.config.current_site.id + "/" + course + "/result/" + valueU + '_' + obj.starttime + '.png';
                                                                    MM.log('Participants:'+valueU+','+signatureFile);
                                                                    MM.fs.fileExists(signatureFile,
                                                                            function(path) {
                                                                                MM.log('Signature '+path+' Existe');
                                                                                var options = {};
                                                                                options.fileKey="file";
                                                                                options.fileName = participants_id[indexU]+'.png';
                                                                                options.mimeType="image/png";
                                                                                options.params = {
                                                                                    itemid:participants_id[indexU]
                                                                                };
                                                                                options.chunkedMode = false;
                                                                                options.headers = {
                                                                                  Connection: "close"
                                                                                };
                                                                                
                                                                                var ft = new FileTransfer();
                                                                                ft.upload(
                                                                                          path,
                                                                                          MM.config.current_site.siteurl + '/local/session/uploadsignatureoffline.php',
                                                                                          function(){
                                                                                            MM.log('Upload réussi');
                                                                                            
    
                                                                                            MM.fs.removeFile (signatureRelFile,
                                                                                                function (result) {
                                                                                                   MM.log('Le fichier '+signatureRelFile+' a bien été effacé');
                                                                                                },
                                                                                                function (result) {
                                                                                                   MM.log('Le fichier '+signatureRelFile+' n a pas pu étre effacé');
                                                                                                }
                                                                                           );
                                                                                          },
                                                                                          function(){
                                                                                             MM.log('Upload pas réussi');
                                                                                            
                                                                                          },
                                                                                          options
                                                                                );
    
                                                                                
                                                                            },
                                                                            function(path) {
                                                                                MM.log('Signature Existe pas');
                                                                            }
                                                                       );
                                                                    
                                                                });
                                                                
                                                                message += 'Synchronisation de la session du '+sessionDate+' Effectuée.<br><br>';
                                                                
                                                                MM.fs.removeFile (sessionFile,
                                                                    function (result) {
                                                                       MM.log('Le fichier '+sessionFile+' a bien été effacé');
                                                                       $("#synchroR").hide();
                                                                       btnSynchro.attr('on','off');
                                                                       MM.popMessage(message, {title:'Synchronisation des résultats', autoclose: 7000, resizable: false});
                                                                    },
                                                                    function (result) {
                                                                       MM.log('Le fichier '+sessionFile+' n a pas pu étre effacé');
                                                                       $("#synchroR").hide();
                                                                       btnSynchro.attr('on','off');
                                                                       
                                                                    }
                                                                    
                                                               );
                                                                
                                                            },
                                                            {
                                                                getFromCache: false,
                                                                saveToCache: false,
                                                                silently: true
                                                            },
                                                            function(e) {
                                                                MM.log("Error updating report/completion " + e);
                                                                //message = "Erreur de synchronisation des notes et résultat de la session "+name+", veuillez réessayer.<br><br>";
                                                                //MM.popErrorMessage(e);
                                                                btnSynchro.attr('on','off');
                                                                $("#synchroR").show();
                                                                
                                                            }
                                                        );
                                                                    
                                                        
                                                        
                                                    
                                                        
                                                    },
                                                    function(result) {
                                                        MM.log( "Session File NOK :" + sessionFile);
                                                        btnSynchro.attr('on','off');
                                                    }
                                                );
                                                    
                                            }
                                        });
                                    }
                                    
                                },
                                function() {
                                    //
                                }
                            );
                        
                        } else {
                            MM.log( "Session En cours" + sessionFile);
                        }
                        
                        
                        MM.widgets.dialogClose();
                        
                        
                    });
                    
                    //Check Button
                    MM.log("Check Button");
                    var selected = [];
                    
                    
                    $('a#lielevelP').on(MM.clickType, function(e) {
                        
                        selected = [];
                        var checkbox = $('#' + $(this).attr('eleve'));
                        
                        MM.log('label clicked:'+$(this).attr('eleve')+"/"+checkbox.val());
                        
                        if(checkbox.is(':checked')) {
                              checkbox.prop('checked',false);
                              var theuser = MM.db.where('users', {userid:parseInt(checkbox.val())});
                              //MM.log('theuser:'+theuser);
                              theuser[0].set('id',parseInt(checkbox.val()));
                              var thenewuser = theuser[0].toJSON();
                              myusers.push(thenewuser);
                              //MM.log('myusers.length:'+myusers.length);
                              var objectWithEvents = $("ul#listeparticipants2 li[eleve='"+$(this).attr('eleve')+"']").detach();
                              
                              if ( $('ul#listeparticipants1').children().length > 0 ) {
                                    var last=0;
                                    $('ul#listeparticipants1 li').each(function() {
                                        if (parseInt($(this).attr('index')) < parseInt(objectWithEvents.attr('index'))) {
                                            last = $(this);
                                        }
                                    });
                                    if (last) {
                                        objectWithEvents.insertAfter(last);
                                    } else {
                                        $('ul#listeparticipants1').prepend(objectWithEvents);
                                    } 
                               } else {
                                    $('ul#listeparticipants1').append(objectWithEvents);
                               }
                               //checkbox.prop('checked',false);
                              //$('ul#listeparticipants1').append(objectWithEvents);
                              //$("ul.nav-v2 li[eleve='"+$(this).attr('eleve')+"']").remove();
                        }
                        else {
                           checkbox.prop('checked',true);
                           checkbox.attr('checked','checked');
                           myusers = $.grep(myusers, function( el ) {
                            return el.id !== parseInt(checkbox.val());
                           });
                           //MM.log('myusers.length:'+myusers.length+'/'+checkbox.val());
                           var objectWithEvents = $("ul#listeparticipants1 li[eleve='"+$(this).attr('eleve')+"']").detach();
                           //var lihtml = objectWithEvents.html();
                           //lihtml = lihtml.replace('<span id="roweleve">&gt;</span>', '<span id="roweleve">&lt;</span>'); 
                           //objectWithEvents.html(lihtml);
                           
                           
                           
                          
                           
                           if ( $('ul#listeparticipants2').children().length > 0 ) {
                                var last=0;
                                $('ul#listeparticipants2 li').each(function() {
                                    if (parseInt($(this).attr('index')) < parseInt(objectWithEvents.attr('index'))) {
                                        last = $(this);
                                    }
                                });
                                if (last) {
                                    objectWithEvents.insertAfter(last);
                                } else {
                                    $('ul#listeparticipants2').prepend(objectWithEvents);
                                } 
                           } else {
                                $('ul#listeparticipants2').append(objectWithEvents);
                           }
                           
                           
                           //$("ul.nav-v li[eleve='"+$(this).attr('eleve')+"']").remove();
                        }
                        
                        //On reinit la search
                        $('input#search').val('');
                        var sword = $( "#search" ).val().toLowerCase();
                        MM.log("Search:"+sword+'/Users:'+users);
                        var searchparticipants = [];
                        myusers.forEach(function(user) {
                            //MM.log("User:"+user.id+'/'+user.fullname);
                            if (user.fullname.toLowerCase().indexOf(sword) != -1) {
                                searchparticipants.push(user);
                                $("ul#listeparticipants1 li[eleve='eleveP"+user.id+"']").removeClass('hide');
                                //MM.log("Searchparticipants:"+user.id+'/'+user.fullname);
                            } else {
                                $("ul#listeparticipants1 li[eleve='eleveP"+user.id+"']").addClass('hide');
                            }
                        });
                        
                        
                        
                        $('input.elevecheckbox:checked').each(function() {
                            MM.log("Check Button Checked:" + $(this).val());
                            selected.push($(this).val());
                            //$('ul.nav-v2').append($("li[eleve='"+$(this).attr('id')+"']" ).prop('outerHTML'));
                            //$("ul.nav-v li[eleve='"+$(this).attr('id')+"']").remove();
                        });
                                             
                        if (selected.length > 0) {
                            MM.log("Check Button:"+selected.length);   
                            
                            var usersSelected = "";
                            $.each(selected, function(indexSelected, valueSelected) {
                                usersSelected += valueSelected+",";
                            });
                            var lenghtSelected = usersSelected.length - 1;
                            if ($('#offlineC option').length>1) { 
                                $("#showSessionL").attr("users",usersSelected.substr(0, lenghtSelected) );
                                $("#stopSessionL").attr("users",usersSelected.substr(0, lenghtSelected) );
                                $("#showCourseL").attr("users",usersSelected.substr(0, lenghtSelected) );
                                $("#stopCourseL").attr("users",usersSelected.substr(0, lenghtSelected) );
                                //$("#showSessionL").show();
                                
                                var resultFile =  MM.config.current_site.id + "/" + courseId + "/result/session.json";
                            
                                MM.fs.findFileAndReadContents(resultFile,
                                    function (result) {
                                        $("#showSessionL").hide();
                                        var obj = JSON.parse(result);
                                        var starttime = obj.starttime;
                                        MM.fs.createFile(resultFile,
                                            function(fileEntry) {
                                                var content = '{"starttime":"'+starttime+'","users":"'+usersSelected.substr(0, lenghtSelected)+'"}';
                                                MM.log('Create Session start :'+content);
                                                MM.fs.writeInFile(fileEntry, content, 
                                                    function(fileUrl) {
                                                        MM.log('Write Session :'+fileUrl);
                                                    },
                                                    function(fileUrl) {
                                                        MM.log('Write Session NOK:'+content);
                                                    }
                                                    
                                                );
                                            },   
                                                
                                            function(fileEntry) {
                                               MM.log('Create Session : NOK');
                                               
                                            }
                                        );
                                    },
                                    function (result) {
                                        $("#showSessionL").show();
                                    }
                                );
                            }
                        } else {
                            var resultFile =  MM.config.current_site.id + "/" + courseId + "/result/session.json";
                            MM.fs.findFileAndReadContents(resultFile,
                                function (result) {
                                        var obj = JSON.parse(result);
                                        var starttime = obj.starttime;
                                        MM.fs.createFile(resultFile,
                                            function(fileEntry) {
                                                var content = '{"starttime":"'+starttime+'","users":""}';
                                                MM.log('Create Session start :'+content);
                                                MM.fs.writeInFile(fileEntry, content, 
                                                    function(fileUrl) {
                                                        MM.log('Write Session :'+fileUrl);
                                                    },
                                                    function(fileUrl) {
                                                        MM.log('Write Session NOK:'+content);
                                                    }
                                                    
                                                );
                                            },   
                                                
                                            function(fileEntry) {
                                               MM.log('Create Session : NOK');
                                               
                                            }
                                        );
                                },
                                function (result) {
                                    $("#showSessionL").hide();
                                }
                            );
                            
                            $("#stopSessionL").attr("users","");
                            $("#showCourseL").attr("users","");
                            $("#stopCourseL").attr("users","");
                                
                            
                        }
                        
                    });
                    
                    $('input.elevecheckbox').on(MM.clickType, function(e) {
                        if($(this).is(':checked'))
                              $(this).prop('checked',false);
                        else
                           $(this).prop('checked',true);
                    });
                    
                    //Select Course
                    MM.log("Selected Course");
                    $('#offlineC').on("change", function(e) {
                        
                        var selectedCourse = $( "#offlineC option:selected" ).val();
                        var option = selectedCourse.split(",");
                        $("#showCourseL").attr("path",option[0]);
                        $("#showCourseL").attr("module",option[1]);
                        $("#stopCourseL").attr("path",option[0]);
                        $("#stopCourseL").attr("module",option[1]);
                        MM.log("Change Selected Course:"+selectedCourse);
                        
                        if (selectedCourse != 0) {
                           MM.log("Selected Course:"+selectedCourse);
                           
                           usersSelected = "";
                           $.each(selected, function(indexSelected, valueSelected) {
                                usersSelected += valueSelected+",";
                           });
                           lenghtSelected = usersSelected.length - 1;
                           $("#showCourseL").show();
                           $("#stopCourseL").hide(); 
                        } else {
                           $("#showCourseL").hide();
                           $("#stopCourseL").hide(); 
                           MM.log("Selected Course NOK");
                        }
                        
                    });
                    
                    
                    //Start Course Offline
                    $("#showSessionL").on(MM.clickType, function(e) {
                        e.preventDefault();
                        /*
                        var path = $(this).attr("path");
                        var course = $(this).attr("course");
                        var users = $(this).attr("users");
                        var module = $(this).attr("module");
                        MM.log('showSessionL:'+path+','+course+','+users+','+module);
                        
                        var usersL = users.split(",");
                        */
                        
                        var course = $(this).attr("course");
                        
                        $('input:checkbox').each(function() {
                            MM.log("Check Button Checked:" + $(this).val());
                            //$(this).attr("disabled", true);
                        });
                        
                        
                        
                        
                        $('#offlineC > option').removeAttr("selected");
                        $('#offlineC option[value="0"]').prop('selected', true);
                        
                        var users = $(this).attr('users');
                        
                        var fileResultL = MM.config.current_site.id+"/"+course+"/result/session.json";
                        MM.fs.createFile(fileResultL,
                            function(fileEntry) {
                                var d = new Date();
                                var content = '{"starttime":"'+d.getTime()+'","users":"'+users+'"}';
                                MM.log('Create Session start :'+content);
                                MM.fs.writeInFile(fileEntry, content, 
                                    function(fileUrl) {
                                        MM.log('Write Session :'+fileUrl);
                                        $('#stopSessionL').attr('starttime',d.getTime());
                                        $('#stopSessionL').hide();
                                        $('#showSessionL').hide();
                                        $('#offlineC').show();
                                    },
                                    function(fileUrl) {
                                        MM.log('Write Session NOK:'+content);
                                    }
                                    
                                );
                            },   
                                
                            function(fileEntry) {
                               MM.log('Create Session : NOK');
                               
                            }
                        );
                        
                    });
                    
                    
                    
                    //Stop Session
                    $("#stopSessionL").on(MM.clickType, function(e) {
                        
                        e.preventDefault();
                        var course = $(this).attr("course");
                        var users = $(this).attr("users");
                        var module = $(this).attr("module");
                        MM.log('stopSessionL:'+course+','+users+','+module);
                        
                        
                        
                        var localCourses = MM.db.where('contents', {'courseid':course, 'site':MM.config.current_site.id});
                        var moduleStart = "";
                        var moduleEnd = "";
                        var modulesId = "";
                        var modules = "";
                        var indexCourse = 0;
                        var indexCourse2 = 1;
                        var usersS = users.split(",");
                        var d = new Date();
                        var timeSession = 0;
                        if ($(this).attr('time') == undefined || $(this).attr('time') == '') {
                            $(this).attr('time',d.getTime());
                            timeSession = d.getTime();
                        } else {
                            timeSession = $(this).attr('time');
                        }
                        timeSession = $(this).attr('starttime');
                        var endSession = d.getTime();
                        
                        var endtime = new Date(parseInt(timeSession));
                        var endDate = endtime.getDate()+"/"+(endtime.getMonth()+1)+"/"+endtime.getFullYear()+" "+endtime.getHours()+":"+endtime.getMinutes();
                        var startimer = $(this).attr('starttime');
                        var startime = new Date(parseInt($(this).attr('starttime')));
                        MM.log('starttime:'+$(this).attr('starttime'));
                        var startDate = startime.getDate()+"/"+(startime.getMonth()+1)+"/"+startime.getFullYear()+" à "+startime.getHours()+":"+startime.getMinutes();
                        
                        var addNote = "Valider";
                        var html = '<div id="sessionContent"><table width="100%" border="1"><tr><td>Apprenants</td><td>Modules</td><td>Actions</td></tr>';

                        var options = {
                            title: 'Récapitulatif de la session du '+startDate,
                            width: "90%",
                            buttons: {}
                        };
                        
                        
                        
                        
                        
                        
                        
                        $.each(localCourses, function( index, value ) {
                            var localCourse = value.toJSON();
                            if (localCourse.contents) {
                                indexCourse++;
                            }
                        });
                        
                        
                        $.each(localCourses, function( index, value ) {
                            var localCourse = value.toJSON();
                            if (localCourse.contents) {
                                var localFile = localCourse.contents[0];
                                var localName = localCourse.name;
                                var localContentId = localCourse.url.split("?id=");
                                var fileResultL = MM.config.current_site.id+"/"+course+"/result/"+localContentId[1]+".json";
                                MM.log('Session Modules Url : '+fileResultL);
                                MM.fs.findFileAndReadContents(fileResultL,
                                    function(path) {
                                        var obj = JSON.parse(path);
                                        MM.log('Session Module Existe : '+fileResultL+ ' : '+obj.starttime + ' : '+obj.endtime + ' : ' + indexCourse2 + ' : ' + indexCourse);
                                        modules = modules + localName + '<br/>';
                                        modulesId = modulesId + localContentId[1]+',';
                                        moduleStart = moduleStart + obj.starttime+',';
                                        moduleEnd = moduleEnd + obj.endtime+',';
                                        MM.log('Session Module Existe : ' + modules + ' : ' + modulesId + ' : ' + moduleStart);
                                        if (indexCourse2 == indexCourse) {
                                            var indexUser = 1;
                                            $.each(usersS, function( indexS, valueS ) {
                                                var userP = MM.db.get('users', MM.config.current_site.id + "-" + valueS);
                                                var userG = userP.toJSON();
                                                var fileSignature = MM.config.current_site.id+"/"+course+"/result/"+valueS+"_"+timeSession+".png";
                                                
                                                var signatureFile = MM.config.current_site.id+"/"+course+"/result/"+valueS + "_" + timeSession + ".png";
                                    
                                                MM.fs.findFileAndReadContents(fileSignature,
                                                    function(path) {
                                                        MM.log('Image Signature OK:'+fileSignature);
                                                        html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td><img src="'+ path +'"></td></tr>';
                                                        if (indexUser == usersS.length) {
                                                            html += '</table></div>';
                                                            MM.log('Session Module Go:');
                                                            MM.widgets.dialog(html, options);
                                                        }
                                                        indexUser++;
                                                    },
                                                    function(path) {
                                                        MM.log('Image Signature NOK:'+fileSignature);
                                                        html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td><button id="signature" course="'+course+'" name="signature" userid="'+valueS+'" time="'+timeSession+'" onclick="signaturePopin(this)">Signature</button></td></tr>';
                                                        if (indexUser == usersS.length) {
                                                            html += '</table></div>';
                                                            MM.log('Session Module Go:');
                                                            MM.widgets.dialog(html, options);
                                                        }
                                                        indexUser++;
                                                    }
                                                );
                                                
                                                MM.fs.fileExists(fileSignature,
                                                    function(path) {
                                                        
                                                        
                                                    },
                                                    function(path) {
                                                        
                                                    }
                                                );
                                                    
                                                
                                            });
                                            
                                            
                                            
                                        }
                                        indexCourse2++;
                                    },
                                    function(path) {
                                        MM.log('Session Module Existe Pas : '+fileResultL);
                                        if (indexCourse2 == indexCourse) {
                                            $.each(usersS, function( indexS, valueS ) {
                                                var userP = MM.db.get('users', MM.config.current_site.id + "-" + valueS);
                                                var userG = userP.toJSON();
                                                html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td><button id="signature" name="signature" userid="'+userG.userid+'" modules="'+modulesId+'" onclick="signaturePopin(this)">Signature</button></td></tr>';
                                            });
                                            html += '</table></div>';
                                            MM.log('Session Module Go:'+html);
                                            
                                            MM.widgets.dialog(html, options);
                                        }
                                        indexCourse2++;
                                    }
                                    
                                );
                                
                            }                              
                                                              
                        });
                        
                        
                        
                        
                        
                        options.buttons[addNote] = function() {
            
                            MM.popConfirm("Etes-vous sûr de vouloir enregistrer cette session ?", function() {
                            
                                var resultFile =  MM.config.current_site.id + "/" + course + "/result/session.json";
                                var message = "Session Enregistrée.";
                                    
                                MM.fs.findFileAndReadContents(resultFile,
                                  function (result) {
                                    MM.log('Load Session : OK' + result);
                                    var obj = JSON.parse(result);
                                    var users = obj.users;
                                    var starttime = obj.starttime;
                                    var realusers = $('#stopSessionL').attr('users');
                        
                        
                                    var lenghto = result.length - 1;
                                    var lenghta = modulesId.length - 1;
                                    var lenghtb = moduleStart.length - 1;
                                    var lenghtc = moduleEnd.length - 1;
                                    var content = '{"starttime":"'+startimer+'","users":"'+realusers+'","endtime":"'+endSession+'"' + ',"modulesId":"'+modulesId.substr(0, lenghta)+'"' + ',"modulesStart":"'+moduleStart.substr(0, lenghtb)+'"' + ',"modulesEnd":"'+moduleEnd.substr(0, lenghtc)+'"}';
                                    
                                    MM.log('Session Load OK : '+resultFile + ' : ' + content + ' : ' + timeSession);
                                    
                                    var fileResult = MM.config.current_site.id+"/"+course+"/result/session_"+timeSession+".json";
                                    
                                    //create local result file
                                    MM.fs.createFile(fileResult,
                                        function(fileEntry) {
                                             MM.fs.writeInFile(fileEntry, content, 
                                                function(fileUrl) {
                                                    
                                                    MM.log('Write Session OK:'+fileUrl);
                                                    MM.log('Write Session content:'+content);
                                                    
                                                    $('#showSessionL').show();
                                                    $('#offlineC').hide();
                                                    $('#showCourseL').hide();
                                                    $('#stopCourseL').hide();
                                                    $('#stopSessionL').hide();
                                                    $("#synchroR").show();
                                                    $("#stopSessionL").attr('time','');
                                                    $("#stopSessionL").attr('starttime','');
                                                    
                                                    $('input:checkbox').each(function() {
                                                        $(this).attr("disabled", false );
                                                    });
                                                    
                                                    message = "Session Enregistrée.";
                                                    var oldFile = MM.config.current_site.id+"/"+course+"/result/session.json";
                                                    MM.fs.removeFile (oldFile,
                                                         function (result) {
                                                            MM.log('session.json deleted:'+oldFile);
                                                         },
                                                         function (result) {
                                                            MM.log('session.json not deleted:'+oldFile);
                                                         }
                                                    );
                                                    
                                                    $.each(localCourses, function( index, value ) {
                                                        var localCourse = value.toJSON();
                                                        if (localCourse.contents) {
                                                            var localFile = localCourse.contents[0];
                                                            var localContentId = localCourse.url.split("?id=");
                                                            var fileResultL = MM.config.current_site.id+"/"+course+"/result/"+localContentId[1]+".json";
                                                            MM.fs.findFileAndReadContents(fileResultL,
                                                                function(path) {
                                                                    MM.fs.removeFile (fileResultL,
                                                                        function (result) {
                                                                           MM.log(fileResultL + ' deleted');
                                                                        },
                                                                        function (result) {
                                                                           MM.log(fileResultL + ' not deleted');
                                                                        }
                                                                   );
                                                                },
                                                                function(path) {
                                                                    
                                                                }
                                                            );
                                                        }
                                                    });
                                                         
                                                    
                                                },
                                                function(fileUrl) {
                                                    MM.log('Write Session NOK:'+content);
                                                    message = "Problème lors de l'écriture.Veuillez Réessayer.";
                                                }
                                                
                                            );
                                        },   
                                            
                                        function(fileEntry) {
                                           MM.log('Create Session : NOK');
                                           message = "Problème lors de l'écriture.Veuillez Réessayer.";
                                        }
                                    );
                                                    
                                    
                                  },
                                  function(result) {
                                    MM.log('Session NOK :'+result+','+resultFile);
                                    message = "Problème lors de l'écriture.Veuillez Réessayer.";
                                  }
                                );
                                
                                
                                MM.widgets.dialogClose();
                                MM.popMessage(message, {title:'Récapitulatif de la session du '+startDate, autoclose: 5000, resizable: false});
                                MM.Router.navigate("eleves/" + course);
                                
                            });
                        };
                        
                        options.buttons[MM.lang.s("cancel")] = function() {
                            MM.Router.navigate("eleves/" + course );
                            MM.widgets.dialogClose();
                        };
                        
                        options.buttons["Effacer"] = function() {
                            MM.popConfirm("Etes-vous sûr de vouloir effacer cette session ?", function() {
                                
                                var resultFile =  MM.config.current_site.id + "/" + course + "/result/session.json";
                                var message = "Session Effacée.";
                                    
                                MM.fs.findFileAndReadContents(resultFile,
                                    function (result) {
                                        MM.fs.removeFile (resultFile,
                                            function (result) {
                                               MM.log('session.json deleted:'+resultFile);
                                            },
                                            function (result) {
                                               MM.log('session.json not deleted:'+resultFile);
                                            }
                                        );
                                    },
                                    function (result) {
                                    
                                    }
                                );
                                
                                $.each(localCourses, function( index, value ) {
                                    var localCourse = value.toJSON();
                                    if (localCourse.contents) {
                                        var localFile = localCourse.contents[0];
                                        var localContentId = localCourse.url.split("?id=");
                                        var fileResultL = MM.config.current_site.id+"/"+course+"/result/"+localContentId[1]+".json";
                                        MM.fs.findFileAndReadContents(fileResultL,
                                            function(path) {
                                                MM.fs.removeFile (fileResultL,
                                                    function (result) {
                                                       MM.log(fileResultL + ' deleted');
                                                    },
                                                    function (result) {
                                                       MM.log(fileResultL + ' not deleted');
                                                    }
                                               );
                                            },
                                            function(path) {
                                                
                                            }
                                        );
                                    }
                                });
                                
                                $.each(usersS, function( indexS, valueS ) {
                                    var userP = MM.db.get('users', MM.config.current_site.id + "-" + valueS);
                                    var userG = userP.toJSON();
                                    var signatureFile = MM.config.current_site.id+"/"+course+"/result/"+userG.userid + "_" + timeSession + ".png";
                                    
                                    MM.fs.findFileAndReadContents(signatureFile,
                                        function(path) {
                                            MM.fs.removeFile (signatureFile,
                                                function (result) {
                                                   MM.log(signatureFile + ' deleted');
                                                },
                                                function (result) {
                                                   MM.log(signatureFile + ' not deleted');
                                                }
                                           );
                                        },
                                        function(path) {
                                            MM.log(signatureFile + ' not exist.');
                                        }
                                    ); 
                                });
                                
                                $('#showSessionL').show();
                                $('#offlineC').hide();
                                $('#showCourseL').hide();
                                $('#stopCourseL').hide();
                                $('#stopSessionL').hide();
                                $("#stopSessionL").attr('time','');
                                $("#stopSessionL").attr('starttime','');
                                
                                $('input:checkbox').each(function() {
                                    $(this).attr("disabled", false );
                                });
                                                    
                                $("#stopSessionL").attr('time','');
                                MM.widgets.dialogClose();
                                MM.popMessage(message, {title:'Récapitulatif de la session du '+startDate, autoclose: 5000, resizable: false});
                                MM.Router.navigate("eleves/" + course);
                                
                                
                            });
                        };
            
                        
            
                        
                    
                    });
                    
                    
                    
                    //Pif button
                    
                    $('button#pif').on(MM.clickType, function(e) {
                        MM.log('pif clicked');
                        //e.preventDefault();
                        var course = $(this).attr("course");
                        var user = $(this).attr("user");
                        var theuser = MM.db.get('users',parseInt(user));
                        MM.log('pif:'+course+'/'+user);
                        
                        var userspif = MM.db.where('users', {userid:parseInt(user)});
                        var userpif = userspif[0].toJSON();
                        var pifs = userpif.pif;
                        pifscourse = $.grep(pifs, function( el ) {
                                        return el.courseid == course;
                        });
                        MM.log('pifscourse length:'+pifscourse.length);
                        
                        var thisuser = MM.db.get('users',userpif.id);
                        
                        var addNote = "Valider";
                        var html = '<div id="sessionContent"><table width="100%" border="1"><tr><td><b>A remplir avant la formation</b></td><td>&nbsp;</td><td><b>A remplir à l’issue du parcours de formation</b></td></tr><tr><td><b>Compétences à développer dans le cadre du parcours de formation</b></td><td><b>Intitulé des séquences pédagogiques</b></td><td><b>Compétences acquises à l’issue du parcours de formation</b></td></tr>';
                        
                        var local_contents = MM.db.where("contents",{courseid : courseId, site: MM.config.current_site.id});
                        local_contents.forEach(function(local_content) {
                             var content = local_content.toJSON();
                             if (content.modname == "scorm") {
                                html +='<tr><td style="height:40px"><input type="checkbox" id="checkboxpif" genre="b" content="'+content.contentid+'" name="b_'+content.contentid+'"';
                                if (pifscourse.length > 0) {
                                    pifscormb = $.grep(pifscourse, function( el ) {
                                        return el.scormid == content.contentid && el.begin == 1;
                                    });
                                    MM.log('pifscormb length:'+pifscormb.length);
                                } else {
                                    pifscormb = [1];
                                }
                                
                                if (pifscormb.length>0) {
                                    html+=' checked="checked"';
                                }
                                html +='></td><td>'+content.name+'</td><td><input id="checkboxpif" genre="a" content="'+content.contentid+'" type="checkbox" name="a_'+content.id+'"';
                                pifscorme = $.grep(pifscourse, function( el ) {
                                        return el.scormid == content.contentid && el.end == 1;
                                });
                                MM.log('pifscorme length:'+pifscorme.length);
                                if (pifscorme.length>0) {
                                    html+=' checked="checked"';
                                }
                                html +='></td></tr>';
                             }
                        });
                        
                        html +='</table></div>';
                        
                        var options = {
                            title: 'Protocole Individuel de Formation bipartite pour '+userpif.fullname,
                            width: "90%",
                            marginTop: "10%",
                            buttons: {}
                        };
                        
                        options.buttons[MM.lang.s("cancel")] = function() {
                            MM.Router.navigate("eleves/" + course );
                            MM.widgets.dialogClose();
                        };
                        
                        options.buttons["Valider"] = function() {
                            MM.log('userspif:'+userspif);
                            if (userspif && userspif != "") {
                                MM.log('userpif:'+userpif);
                                MM.log('pifs:'+pifs);
                                pifs2 = $.grep(pifs, function( el ) {
                                        MM.log('grep:'+el.courseid+'/'+course);
                                        return el.courseid != course;
                                });
                                MM.log('pifs length:'+pifs2.length);
                                MM.log('thisuser:'+userpif.id+'/'+thisuser.id);
                                var b;
                                var a;
                                var scormid;
                                $('input#checkboxpif').each(function(index) {
                                  if ($(this).attr('genre') == 'b') {
                                    scormid = $(this).attr('content');
                                    if ($(this).is(':checked')) {
                                        a = 1;
                                    } else {
                                        a = 0;
                                    }
                                  }
                                  if ($(this).attr('genre') == 'a') {
                                    if ($(this).is(':checked')) {
                                        b = 1;
                                    } else {
                                        b = 0;
                                    }
                                    pifs2.push({courseid:course,scormid:scormid,begin:a,end:b});
                                    
                                  }
                                  MM.log('checkboxes:'+$(this).attr('genre')+'/'+$(this).attr('content')+'/'+$(this).is(':checked')  );
                                });
                                MM.log('pifs length:'+pifs2.length)
                                MM.log('pif:'+pifs2[0]+'/'+pifs2[0].scormid);
                                thisuser.save({pif:pifs2});
                            }
                            //MM.Router.navigate("eleves/" + course );
                            MM.widgets.dialogClose();
                        }
                        
                        MM.widgets.dialog(html, options);
                        
                    });
                    
                    
                    //Notes button
                    
                    $('button#notes').on(MM.clickType, function(e) {
                        MM.log('notes clicked');
                        var button=$(this);
                        //e.preventDefault();
                        var course = $(this).attr("course");
                        var user = $(this).attr("user");
                        var theuser = MM.db.get('users',parseInt(user));
                        MM.log('Notes:'+course+'/'+user);
                        
                        var usersnotes = MM.db.where('users', {userid:parseInt(user)});
                        var usernotes = usersnotes[0].toJSON();
                        var notes = usernotes.notes;
                        notescourse = $.grep(notes, function( el ) {
                                        return el.courseid == course;
                        });
                        MM.log('notescourse length:'+notescourse.length);
                        
                        var thisuser = MM.db.get('users',usernotes.id);
                        
                        var addNote = "Valider";
                        var html = '<div id="sessionContent"><table width="100%" border="1">';
                        
                        notescourse.forEach(function(notecourse) {
                            //
                            var datenote =  new Date(notecourse.notetime*1000);
                            var notetime = datenote.getDate()+"/"+(datenote.getMonth()+1)+"/"+datenote.getFullYear();
                            html+='<tr><td style="height:40px;width:100px">'+notetime+'</td><td>'+notecourse.note+'</td></tr>';
                        });
                        
                        
                        html+='</table></div>';
                        
                        var options = {
                            title: 'Notes pour '+usernotes.fullname,
                            width: "90%",
                            buttons: {}
                        };
                        
                        options.buttons[MM.lang.s("cancel")] = function() {
                            MM.Router.navigate("eleves/" + course );
                            MM.widgets.dialogClose();
                        };
                        
                        options.buttons["Ajouter une note"] = function() {
                            
                            MM.widgets.dialogClose();
                            
                            var html2 = '<div id="sessionContent"><table width="100%" border="1">';
                            html2+='<tr><td style="height:40px"><textarea id="thenote" cols="20" rows="5" name="thenote"></textarea></td></tr>';
                            html2+='<script>$("#thenote").focus();</script>';
                            html2+='</table></div>';
                            
                            var options2 = {
                                title: 'Ajouter une note pour '+usernotes.fullname,
                                width: "90%",
                                buttons: {}
                            };
                            
                            options2.buttons[MM.lang.s("cancel")] = function() {
                                //MM.Router.navigate("eleves/" + course );
                                MM.widgets.dialogClose();
                                button.click();
                            };
                            
                            
                            options2.buttons["Valider"] = function() {
                                MM.widgets.dialogClose();
                                MM.log('Valider Ajout Note');
                                
                                
                                
                                var resultFile =  MM.config.current_site.id + "/" + course + "/result/session.json";
                                MM.fs.findFileAndReadContents(resultFile,
                                    function (result) {
                                            var obj = JSON.parse(result);
                                            var starttime = obj.starttime;
                                            var users = obj.users;
                                            
                                            if (obj.notes)
                                                var getnotes = obj.notes;
                                            
                                            if (getnotes)
                                                getnotes.push({"note":$('#thenote').val().replace(/\"/g,'\\"'),"userid":user});
                                            else 
                                                getnotes = '{"note":"'+$("#thenote").val().replace(/\"/g,'\\"')+'","userid":'+user+'}';
                                            
                                            MM.log('getnotes:'+getnotes);
                                            
                                            MM.fs.createFile(resultFile,
                                                function(fileEntry) {
                                                    var content = '{"starttime":"'+starttime+'","users":"'+users+'","notes":"'+getnotes+'"}';
                                                    MM.log('Recreate Session start :'+content);
                                                    MM.fs.writeInFile(fileEntry, content, 
                                                        function(fileUrl) {
                                                            MM.log('Write Session OK:'+fileUrl);
                                                            button.click();
                                                        },
                                                        function(fileUrl) {
                                                            MM.log('Write Session NOK:'+content);
                                                            button.click();
                                                        }
                                                        
                                                    );
                                                },   
                                                    
                                                function(fileEntry) {
                                                   MM.log('Create Session : NOK');
                                                   button.click();
                                                   
                                                }
                                            );
                                    },
                                    function (result) {
                                        MM.log('Session file not found');
                                        button.click();
                                    }
                                );
                            
                                
                            }
                            
                            MM.widgets.dialog(html2, options2);
                            
                            
                        }
                        
                        MM.widgets.dialog(html, options);
                        
                    });
                
                    
                    
                    //Start Course Offline
                    $("#showCourseL").on(MM.clickType, function(e) {
                        e.preventDefault();
                        var path = $(this).attr("path");
                        var course = $(this).attr("course");
                        var users = $(this).attr("users");
                        var module = $(this).attr("module");
                        MM.log('showCourseL:'+path+','+course+','+users+','+module);
                        
                        var usersL = users.split(",");
                        
                        
                                var fileResultL = MM.config.current_site.id+"/"+course+"/result/"+module+".json";
                                MM.fs.createFile(fileResultL,
                                    function(fileEntry) {
                                        var d = new Date();
                                        var content = '{"starttime":"'+d.getTime()+'"}';
                                        MM.log('Create Result :'+content);
                                        MM.fs.writeInFile(fileEntry, content, 
                                            function(fileUrl) {
                                                MM.log('Write Result :'+fileUrl);
                                                $('#stopCourseL').show();
                                                $('#showCourseL').hide();
                                                $('#stopSessionL').hide();
                                                $('#offlineC').hide();
                                                MM.plugins.resource._showResource(path);
                                    
                                                
                                                
                                            },
                                            function(fileUrl) {
                                                MM.log('Write Result NOK:'+content);
                                                //MM.plugins.resource._showResource(path);
                                            
                                            }
                                            
                                        );
                                    },   
                                        
                                    function(fileEntry) {
                                       MM.log('Create Result : NOK');
                                       //MM.plugins.resource._showResource(path);
                                    }
                                );
                    
                    });
                    
                    
                    //Stop Course Offline
                    $("#stopCourseL").on(MM.clickType, function(e) {
                        e.preventDefault();
                        var course = $(this).attr("course");
                        var users = $(this).attr("users");
                        var module = $(this).attr("module");
                        MM.log('stopCourseL:'+course+','+users+','+module);
                        
                        var addNote = "Ajouter";

                        var options = {
                            title: 'Récapitulatif de la session',
                            width: "100%",
                            buttons: {}
                        };
            
                        var html = '';
                        if (users!="") {
                        	var usersS = users.split(",");
                        	$.each(usersS, function( indexS, valueS ) {
                            		MM.log(indexS+','+valueS);
                                    var userP = MM.db.get('users', MM.config.current_site.id + "-" + valueS);
                            		MM.log('stopCourseL each:'+valueS+','+userP);
                            		var userG = userP.toJSON();
                            		html += '<label>'+userG.fullname+':</label><input type="text" id="addnotescore'+indexS+'" user="'+userG.userid+'" name="addnotescore'+indexS+'" value=""> % <br>';
                        	});
                        }

                        var resultFile =  MM.config.current_site.id + "/" + course + "/result/" + module + ".json";
                                
                        MM.fs.findFileAndReadContents(resultFile,
                            function (result) {
                              MM.log('Result OK :'+result);
                              var d = new Date();
                              var lenghto = result.length - 1;
                              var content = result.substr(0, lenghto) + ',"endtime":"'+d.getTime()+'"}';
                              MM.log('Create Result :'+content);
                              var fileResult = MM.config.current_site.id+"/"+course+"/result/"+module+".json";
                              
                              
                              //create local result file
                              MM.fs.createFile(fileResult,
                                  function(fileEntry) {
                                       MM.fs.writeInFile(fileEntry, content, 
                                          function(fileUrl) {
                                              MM.log('Write Result OK:'+fileUrl);
                                              var selectedCourse = $( "#offlineC option:selected" ).val();
                                              
                                              $('#stopCourseL').hide();
                                              if (selectedCourse != 0)
                                                $("#showCourseL").show();
                                              else
                                                $("#showCourseL").hide();
                                              $('#stopSessionL').show();
                                              $('#offlineC').show();
                                          },
                                          function(fileUrl) {
                                              MM.log('Write Result NOK:'+content);
                                          }
                                          
                                      );
                                  },   
                                      
                                  function(fileEntry) {
                                     MM.log('Create Result : NOK');
                                     
                                  }
                              );
                            },
                            function(result) {
                              MM.log('Result NOK :'+result+','+resultFile);
                    
                            }
                        );
                    
                    });
                    
                    
                    $('#search').keyup(function(e) {
                        var sword = $( "#search" ).val().toLowerCase();
                        MM.log("Search:"+sword+'/Users:'+users);
                        var searchparticipants = [];
                        myusers.forEach(function(user) {
                            //MM.log("User:"+user.id+'/'+user.fullname);
                            if (user.fullname.toLowerCase().indexOf(sword) != -1) {
                                searchparticipants.push(user);
                                $("ul#listeparticipants1 li[eleve='eleveP"+user.id+"']").removeClass('hide');
                                //MM.log("Searchparticipants:"+user.id+'/'+user.fullname);
                            } else {
                                $("ul#listeparticipants1 li[eleve='eleveP"+user.id+"']").addClass('hide');
                            }
                        });
                        var participants = $( '#listeParticipants' ).val();
                        
                        if (searchparticipants && searchparticipants != "") {
                            $.each(searchparticipants, function( index, myparticipant ) {
                                //var myparticipant = value.toJSON();
                                MM.log('Find participant :'+myparticipant.fullname+'/'+myparticipant.id);
                            });
                        }
                        
                        
                    });

                }, function(m) {
                    // Removing loading icon.
                    $('a[href="#eleves/' +courseId+ '"]').removeClass('loading-row');
                    if (typeof(m) !== "undefined" && m) {
                        MM.popErrorMessage(m);
                    }
                }
            );
        },

        _loadEleves: function(courseId, limitFrom, limitNumber, successCallback, errorCallback) {
            var data = {
                "courseid" : courseId,
                "userid" : MM.site.get('userid'),
                "options[0][name]" : "limitfrom",
                "options[0][value]": limitFrom,
                "options[1][name]" : "limitnumber",
                "options[1][value]": limitNumber,
            };

            MM.moodleWSCall(
                'local_mobile_get_users_by_courseid_departmentid',
                data,
                function(users) {
                    
                    
                    var onlines = MM.db.where("contents", {name:'online',courseid:courseId,site:MM.config.current_site.id});
                    MM.log('onlines:'+onlines);
                    if (onlines && onlines != "") {
                        var online = onlines[0].toJSON();
                        MM.log('online:'+MM.config.current_site.id + "-" + courseId + ',' +online.url);
                        $.each(users, function(index, user) {
                                users[index].online = online.url;
                        });
                    }
                    //var offline = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
                    //offline = offline.toJSON();
                    successCallback(users);
                },
                {
                    logging: {
                        method: 'core_user_view_user_list',
                        data: {
                            courseid: courseId
                        }
                    }
                },
                function(m) {
                    errorCallback(m);
                }
            );
        },

        showEleve: function(courseId, userId, popUp) {
            popUp = popUp || false;
            MM.log('showEleve'+userId);
            var menuEl = 'a[href="#eleve/' + courseId + '/' + userId + '"]';
            $(menuEl, '#panel-center').addClass('loading-row-black');

            var data = {
                "userlist[0][userid]": userId,
                "userlist[0][courseid]": courseId
            };
            

            MM.moodleWSCall(
                'moodle_user_get_course_participants_by_id',
                data,
                function(users) {
                    // Load the active user plugins.

                    var userPlugins = [];
                    for (var el in MM.plugins) {
                        var plugin = MM.plugins[el];
                        if (plugin.settings.type == "user") {
                            if (typeof(plugin.isPluginVisible) == 'function' && !plugin.isPluginVisible()) {
                                continue;
                            }
                            userPlugins.push(plugin.settings);
                        }
                    }

                    var newUser = users.shift();

                    var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
                    MM.log('offlines Course:'+course+','+courseId);
                    var pageTitle = "";
                    if (course) {
                        pageTitle = MM.lang.s("eleve");
                    }

                    var countries = JSON.parse(MM.plugins.eleves.templates.countries.json);
                    if (newUser.country && typeof countries[newUser.country] != "undefined") {
                        newUser.country = countries[newUser.country];
                    }
                    
                    
                    
                    var test1 = MM.db.where("contents", {"name":"offline", "courseid" : courseId,  'site':MM.config.current_site.id});
                    var test2 = MM.db.where('contents', {'name':'offline',  'site':MM.config.current_site.id});
                    var test3 = MM.db.where('contents', {'courseid':courseId, 'site':MM.config.current_site.id});
                    var offlines = MM.db.where("contents", {"courseid" : courseId,"name":"offline", 'site':MM.config.current_site.id});
                    var test4 = MM.db.get("contents", MM.config.current_site.id + "-96");
                    
                    MM.log('offlines:'+offlines+'::'+courseId+'::'+test1+'::'+test2+'::'+test3+'::'+test4);
                    if (offlines && offlines != "") {
                        
                        var offline = offlines[0].toJSON();
                        //var offline = offlines.toJSON();
                        var file = offline.contents[0];
                        contentid = offline.url.split("?id=");
                        
                        var pathCourse = MM.plugins.contents.getLocalPaths2(courseId, contentid[1], file);
                        
                        MM.log('offline Course:'+pathCourse.file+','+pathCourse.directory+','+contentid[1]);
                        
                        
                        MM.fs.fileExists(pathCourse.file,
                            function(path) {
                                
                                newUser.offline = MM.fs.getRoot() + '/' + pathCourse.file;
                                newUser.debug = 3;
                                newUser.contentid = contentid[1];
                                //var pathResult = MM.plugins.contents.getLocalPaths(courseId, newUser.id, "result.json");
                                            
                                //MM.log('offline Result:'+pathResult.file+','+pathResult.directory+','+path);
                                
                                MM.log('offline Sumary:'+newUser.debug+','+newUser.offline);
                                var tpl = {
                                    "user": newUser,
                                    "plugins": userPlugins,
                                    "courseid": courseId,
                                    "popUp": popUp
                                };
            
                                var html = MM.tpl.render(MM.plugins.eleves.templates.eleve.html, tpl);
                                newUser.id = MM.config.current_site.id + "-" + newUser.id;
                                MM.db.insert("users", newUser);
            
                                $(menuEl, '#panel-center').removeClass('loading-row-black');
                                MM.panels.show('right', html, {title: pageTitle});
                                
                                MM.plugins.eleves.contentsPageRendered();
                                
                            
                            },
                            function(path) {
                               newUser.offline = "no_offline_content";
                               newUser.debug = 2;
                               MM.log('offline Result: Not exist');
                               
                               MM.log('offline Sumary:'+newUser.debug+','+newUser.offline);
                                var tpl = {
                                    "user": newUser,
                                    "plugins": userPlugins,
                                    "courseid": courseId,
                                    "popUp": popUp
                                };
            
                                var html = MM.tpl.render(MM.plugins.eleves.templates.eleve.html, tpl);
                                newUser.id = MM.config.current_site.id + "-" + newUser.id;
                                MM.db.insert("users", newUser);
            
                                $(menuEl, '#panel-center').removeClass('loading-row-black');
                                MM.panels.show('right', html, {title: pageTitle});
                            }
                        );
                    
                        
                    } else {
                        newUser.offline = "no_offline_content";
                        newUser.debug = 1;
                        
                        MM.log('offline Sumary:'+newUser.debug+','+newUser.offline);
                        var tpl = {
                            "user": newUser,
                            "plugins": userPlugins,
                            "courseid": courseId,
                            "popUp": popUp
                        };
    
                        var html = MM.tpl.render(MM.plugins.eleves.templates.eleve.html, tpl);
                        newUser.id = MM.config.current_site.id + "-" + newUser.id;
                        MM.db.insert("users", newUser);
    
                        $(menuEl, '#panel-center').removeClass('loading-row-black');
                        MM.panels.show('right', html, {title: pageTitle});
                    }
                    
                    
                    
                },
                {
                    logging: {
                        method: 'core_user_view_user_profile',
                        data: {
                            courseid: courseId,
                            userid: userId
                        }
                    }
                }
            );
        },

        /**
         * Check if we can show the grades button for this user.
         * @param  {integer} courseId The course id
         * @param  {integer} userId   The user Id
         * @return {boolean}          True or false
         */
        _showGrades: function(courseId, userId) {
            if (MM.plugins.grades.wsName == 'local_mobile_gradereport_user_get_grades_table') {
                return true;
            }
            return false;
        },
        
        


        templates: {
            "eleve": {
                model: "eleve",
                html: eleveTpl
            },
            "eleves": {
                html: elevesTpl
            },
            "elevesRow": {
                html: elevesRowTpl
            },
            "countries": {
                json: countriesJSON
            }
        }
    }

    MM.registerPlugin(plugin);
});
