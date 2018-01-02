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
            
            options.buttons[MM.lang.s("cancel")] = function() {
                MM.Router.navigate("eleve/" + courseId + "/" + userId);
                MM.widgets.dialogClose();
            };
            options.buttons[MM.lang.s("cancel")]['style'] = "modal-button-3";
            
            options.buttons[addNote]['style'] = "modla-button-1";
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
                    var sessioncurrent = 0;
                    
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
                    //Get Last Version Pif of User
                    var pifscourse = new Array();
                    var versionArray = new Array();
                    $.each(users, function( index, user ) {
                            versionArray[index] = 0;
                            pifscourse[index] = $.grep(user.pif, function( el ) {
                                            return el.courseid == courseId;
                            });
                            if (pifscourse[index].length > 0) {
                                $.each(pifscourse[index], function( indexpif, pif ) {
                                    if (pif.version > versionArray[index] ) {
                                        versionArray[index] = pif.version
                                    }
                                });
                            }
                            versionArray[index] = versionArray[index] + 1;
                            
                            //Recup des signatures avenants => version>=2
                            for (var av=2;av<versionArray[index];av++) {
                                MM.log('Upload signature avenant:'+user.id+' et cours:'+courseId);
                                var downloadUrlav = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+user.id+'_'+av+'_signature_manager.png');
                                var uploadFileav = MM.config.current_site.id+"/"+courseId+"/"+user.id+"_"+av+"_signature_manager.png";
                                if (MM.deviceConnected()) {
                                
                                        MM.fs.createFile(uploadFileav,
                                            function(fullpath) {
                                                MM.log("Création de "+uploadFileav+" OK");
                                                MM.moodleDownloadFile(downloadUrlav, uploadFileav,
                                                    function(fullpath) {
                                                        MM.log("Upload de "+downloadUrlav+" vers "+uploadFileav+" OK");
                                                    },
                                                    function(fullpath) {
                                                        MM.log("Upload de "+downloadUrlav+" vers "+uploadFileav+" NOK");
                                                    },
                                                    false,
                                                    function (percent) {
                                                       MM.log(percent);
                                                    }
                                                );
                                            },
                                            function(fullpath) {
                                                MM.log("Création de "+uploadFileav+" NOK");
                                            }
                                        );
                                }
                                
                                var downloadUrlavs = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+user.id+'_'+av+'_signature_stagiaire.png');
                                var uploadFileavs = MM.config.current_site.id+"/"+courseId+"/"+user.id+"_"+av+"_signature_stagiaire.png";
                                if (MM.deviceConnected()) {
                                
                                        MM.fs.createFile(uploadFileavs,
                                            function(fullpath) {
                                                MM.log("Création de "+uploadFileavs+" OK");
                                                MM.moodleDownloadFile(downloadUrlavs, uploadFileavs,
                                                    function(fullpath) {
                                                        MM.log("Upload de "+downloadUrlavs+" vers "+uploadFileavs+" OK");
                                                    },
                                                    function(fullpath) {
                                                        MM.log("Upload de "+downloadUrlavs+" vers "+uploadFileavs+" NOK");
                                                    },
                                                    false,
                                                    function (percent) {
                                                       MM.log(percent);
                                                    }
                                                );
                                            },
                                            function(fullpath) {
                                                MM.log("Création de "+uploadFileavs+" NOK");
                                            }
                                        );
                                } 
                            }
                    });
                    
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
                        var group = $('<optgroup label=""></optgroup>');
                        group.appendTo($('#offlinceC'));
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
                            //$('#offlineC').show();
                            $('#offlineC').css('visibility','visible');
                            $('#showCourseL').hide();
                            $('#stopCourseL').hide();
                            $('#stopSessionL').show();      
                            $('#synchroR').hide();
                            $('#showSessionL').attr('users',users);
                            $('#showCourseL').attr('users',users);
                            $('#stopCourseL').attr('users',users);
                            $('#stopSessionL').attr('users',users);
                            $('#stopSessionL').attr('starttime',obj.starttime);
                            
                            sessioncurrent = 1;
                            
                            
                        },
                        function (result) {
                            MM.log('Load Session : NOK' + result);
                            if ($('#offlineC option').length>1) {    
                                $('input:checked').each(function() {
                                    $('#showSessionL').show();
                                });
                            }
                            
                            //$('#offlineC').hide();
                            $('#offlineC').css('visibility','hidden');
                            $('#showCourseL').hide();
                            $('#stopCourseL').hide();
                            $('#stopSessionL').hide();      
                            $('#synchroR').hide();
                        }
                    );
                    
                    
                    
                    var directoryResult = MM.config.current_site.id + "/" + courseId + "/result/";
                    MM.fs.getDirectoryContents(directoryResult,
                        function(entries) {

                            if(entries.length > 0) {
                                
                                $.each(entries, function(index, entry) {
                                    
                                    MM.log('Session Stockée:'+entry.name);
                                    var name = entry.name.split("session_");
                                    if (name[1] && !sessioncurrent) {
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
                                                     //$('#offlineC').hide();
                                                     $('#offlineC').css('visibility','hidden');
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
                        versions: versionArray,
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
                    $.each(users, function( index, user ) {
                    //users.forEach(function(index,user) {
                        newUser = {
                            'id': MM.config.current_site.id + '-' + user.id,
                            'userid': user.id,
                            'fullname': user.fullname,
                            'profileimageurl': user.profileimageurl,
                            'notes':user.notes,
                            'lastname': user.lastname,
                            'firstname': user.firstname,
                            'email': user.email
                        };
                        var checkUser = MM.db.get('users', MM.config.current_site.id + "-" + user.id);
                        if (checkUser && !MM.deviceConnected()) {
                            //Cas ou on recupere pas les infos serveurs
                            
                            var checkUserJ = checkUser.toJSON();
                            newUser.pif = checkUserJ.pif;
                            MM.log('Check User:'+checkUserJ.id);
                            //newUser.pif = user.pif;
                        }
                        if (checkUser && MM.deviceConnected()) {
                            var newpif = user.pif;
                            checkUserJ = checkUser.toJSON();
                            checkUserJ.pif.forEach(function(checkpif) {
                                var checkpifexist = 0;
                                var checkpifexist = $.grep(user.pif, function( el ) {
                                        return el.courseid == checkpif.courseid && el.version == checkpif.version  && el.scormid == checkpif.scormid
                                });
                                if (!checkpifexist || checkpifexist == '') {
                                    
                                    if (versionArray[index] <= checkpif.version)
                                        versionArray[index] = versionArray[index] + 1;
                                    $('button#pif[user="'+user.id+'"]').attr('version',versionArray[index]);
                                    
                                    newpif.push(checkpif);   
                                } else {
                                    //MM.log('CHECK USER CONNECTED: ALREADY');
                                }
                            });
                            newUser.pif = newpif;
                        }
                        if (!checkUser) {
                            newUser.pif = user.pif;
                        }
                        
                        //var newuserpif = newUser.toJSON();
                        
                        
                        
                        var pifusercoursewithsignature1 = $.grep(newUser.pif, function( el ) {
                                        return el.courseid == courseId && el.signature_avant_manager == 1;
                        });
                        
                        if (pifusercoursewithsignature1[0]) {
                            MM.log('Signature Pif 1 pour User:'+user.id+' et cours:'+courseId+' Existe');
                            var downloadUrl1 = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+user.id+'_signature_manager_avant.png');
                            var uploadFile1 = MM.config.current_site.id+"/"+courseId+"/"+user.id+"_signature_manager_avant.png";
                            /*
                            MM.fs.fileExists(uploadFile1,
                                function(fullpath) {
                                    MM.log(uploadFile1+' Présent');
                                },
                                function(fullpath) {
                            */
                            if (MM.deviceConnected()) {
                                
                                    MM.log(uploadFile1+' Pas Présent');
                                    MM.fs.createFile(uploadFile1,
                                        function(fullpath) {
                                            MM.log("Création de "+uploadFile1+" OK");
                                            MM.moodleDownloadFile(downloadUrl1, uploadFile1,
                                                function(fullpath) {
                                                    MM.log("Upload de "+downloadUrl1+" vers "+uploadFile1+" OK");
                                                },
                                                function(fullpath) {
                                                    MM.log("Upload de "+downloadUrl1+" vers "+uploadFile1+" NOK");
                                                },
                                                false,
                                                function (percent) {
                                                   MM.log(percent);
                                                }
                                            );
                                        },
                                        function(fullpath) {
                                            MM.log("Création de "+uploadFile1+" NOK");
                                        }
                                    );
                            }
                            /*
                                }
                            );
                            */
                        }
                        
                        
                        var pifusercoursewithsignature2 = $.grep(newUser.pif, function( el ) {
                                        return el.courseid == courseId && el.signature_avant_stagiaire == 1;
                        });
                        
                        if (pifusercoursewithsignature2[0]) {
                            MM.log('Signature Pif 2 pour User:'+user.id+' et cours:'+courseId+' Existe');
                            var downloadUrl2 = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+user.id+'_signature_stagiaire_avant.png');
                            var uploadFile2 = MM.config.current_site.id+"/"+courseId+"/"+user.id+"_signature_stagiaire_avant.png";
                            /*
                            MM.fs.fileExists(uploadFile2,
                                function(fullpath) {
                                    MM.log(uploadFile2+' Présent');
                                },
                                function(fullpath) {
                            */
                            if (MM.deviceConnected()) {
                                    MM.log(uploadFile2+' Pas Présent');
                                    MM.fs.createFile(uploadFile2,
                                        function(fullpath) {
                                            MM.log("Création de "+uploadFile2+" OK");
                                            MM.moodleDownloadFile(downloadUrl2, uploadFile2,
                                                function(fullpath) {
                                                    MM.log("Upload de "+downloadUrl2+" vers "+uploadFile2+" OK");
                                                },
                                                function(fullpath) {
                                                    MM.log("Upload de "+downloadUrl2+" vers "+uploadFile2+" NOK");
                                                },
                                                false,
                                                function (percent) {
                                                   MM.log(percent);
                                                }
                                            );
                                        },
                                        function(fullpath) {
                                            MM.log("Création de "+uploadFile2+" NOK");
                                        }
                                    );
                            }
                            /*
                                }
                            );
                            */
                        }
                        
                        
                        var pifusercoursewithsignature3 = $.grep(newUser.pif, function( el ) {
                                        return el.courseid == courseId && el.signature_apres_manager == 1;
                        });
                        
                        if (pifusercoursewithsignature3[0]) {
                            MM.log('Signature Pif 3 pour User:'+user.id+' et cours:'+courseId+' Existe');
                            var downloadUrl3 = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+user.id+'_signature_manager_apres.png');
                            var uploadFile3 = MM.config.current_site.id+"/"+courseId+"/"+user.id+"_signature_manager_apres.png";
                            /*
                            MM.fs.fileExists(uploadFile3,
                                function(fullpath) {
                                    MM.log(uploadFile3+' Présent');
                                },
                                function(fullpath) {
                            */
                            if (MM.deviceConnected()) {
                                    MM.log(uploadFile3+' Pas Présent');
                                    MM.fs.createFile(uploadFile3,
                                        function(fullpath) {
                                            MM.log("Création de "+uploadFile3+" OK");
                                            MM.moodleDownloadFile(downloadUrl3, uploadFile3,
                                                function(fullpath) {
                                                    MM.log("Upload de "+downloadUrl3+" vers "+uploadFile3+" OK");
                                                },
                                                function(fullpath) {
                                                    MM.log("Upload de "+downloadUrl3+" vers "+uploadFile3+" NOK");
                                                },
                                                false,
                                                function (percent) {
                                                   MM.log(percent);
                                                }
                                            );
                                        },
                                        function(fullpath) {
                                            MM.log("Création de "+uploadFile3+" NOK");
                                        }
                                    );
                            }
                            /*
                                }
                            );
                            */
                        }
                        
                        var pifusercoursewithsignature4 = $.grep(newUser.pif, function( el ) {
                                        return el.courseid == courseId && el.signature_apres_stagiaire == 1;
                        });
                        
                        if (pifusercoursewithsignature4[0]) {
                            MM.log('Signature Pif 4 pour User:'+user.id+' et cours:'+courseId+' Existe');
                            var downloadUrl4 = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+user.id+'_signature_stagiaire_apres.png');
                            var uploadFile4 = MM.config.current_site.id+"/"+courseId+"/"+user.id+"_signature_stagiaire_apres.png";
                            /*
                            MM.fs.fileExists(uploadFile4,
                                function(fullpath) {
                                    MM.log(uploadFile4+' Présent');
                                },
                                function(fullpath) {
                            */
                            if (MM.deviceConnected()) {
                                    MM.log(uploadFile4+' Pas Présent');
                                    MM.fs.createFile(uploadFile4,
                                        function(fullpath) {
                                            MM.log("Création de "+uploadFile4+" OK");
                                            MM.moodleDownloadFile(downloadUrl4, uploadFile4,
                                                function(fullpath) {
                                                    MM.log("Upload de "+downloadUrl4+" vers "+uploadFile4+" OK");
                                                },
                                                function(fullpath) {
                                                    MM.log("Upload de "+downloadUrl4+" vers "+uploadFile4+" NOK");
                                                },
                                                false,
                                                function (percent) {
                                                   MM.log(percent);
                                                }
                                            );
                                        },
                                        function(fullpath) {
                                            MM.log("Création de "+uploadFile4+" NOK");
                                        }
                                    );
                            }
                            /*
                                }
                            );
                            */
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
                        
                        if (MM.deviceConnected())
                            var messagestart = 'Synchronisation des sessions en cours. Veuillez patienter.';
                        else
                            var messagestart = 'Veuillez vous connecter pour synchroniser vos résultats.';
                        
                        MM.log('MessageStart:'+messagestart);
                        MM.popMessage(messagestart, {title:'Synchronisation des résultats', autoclose: 0, resizable: false});
                            
                        //Get Pifs
                        var pifscourse = new Array();
                        var pifsusers = "";
                        var userspif = MM.db.where("users",{site: MM.config.current_site.id});
                        $.each(userspif, function( indexUsers, userpif ) {
                            var jsonpif = userpif.toJSON();
                            var pifs = jsonpif.pif;
                            MM.log('UsersPif:'+jsonpif.id+'/'+course+'/'+MM.config.current_site.id);
                            pifsusers += jsonpif.userid+',';
                            if (!pifs) {
                                pifs = '[]';
                            }
                            pifscourse[indexUsers] = $.grep(pifs, function( el ) {
                                            return el.courseid == course;
                            });
                            MM.log('pifscourse:'+pifscourse.length);
                        });
                        
                        $.each(userspif, function( indexUsers, userpif ) {
                            
                            jsonpif = userpif.toJSON();
                            
                            var filePifSignatures = MM.config.current_site.id+"/"+course+"/"+jsonpif.userid+"_pifsignatures.json";
                            MM.log('Synchro filePifSignatures : ' + filePifSignatures);
                            MM.fs.findFileAndReadContents(filePifSignatures,
                                function (result) {
                                    pifSignatureArray = JSON.parse(result);
                                    var countPifSig = pifSignatureArray.length;
                                    var indexPifSig = 0;
                                    $.each(pifSignatureArray, function( indexPif, valuePif ) {
                                        var file = valuePif.split("/");
                                        var options2 = {};
                                        options2.fileKey="file";
                                        options2.fileName = file[file.length-1];
                                        options2.mimeType="image/png";
                                        options2.params = {
                                            course:course
                                        };
                                        options2.chunkedMode = false;
                                        options2.headers = {
                                          Connection: "close"
                                        };
                                        MM.log('Pif Json:'+valuePif+'||'+file[file.length-1]);
                                         MM.fs.fileExists(valuePif,
                                            function(path) {
                                                var ft = new FileTransfer();
                                                    ft.upload(
                                                            path,
                                                            MM.config.current_site.siteurl + '/local/session/uploadsignaturepif.php',
                                                            function(){
                                                              MM.log('Upload Pif réussi:'+path);
                                                              indexPifSig = indexPifSig + 1;
                                                              if (indexPifSig == countPifSig) {
                                                                    MM.fs.removeFile (filePifSignatures,
                                                                        function (result) {
                                                                           MM.log('Le fichier '+filePifSignatures+' a bien été effacé');
                                                                           
                                                                        },
                                                                        function (result) {
                                                                           MM.log('Le fichier '+filePifSignatures+' n a pas pu étre effacé');
                                                                        }
                                                                    );
                                                                }
                                                            },
                                                            function(){
                                                               MM.log('Upload Pif pas réussi:'+path);
                                                            },
                                                            options2
                                                  );
                                            },
                                            function (path) {
                                                MM.log('Pif signature existe pas:'+path+'||'+MM.config.current_site.id+"/"+course+"/"+valuePif);
                                                indexPifSig = indexPifSig + 1;
                                                if (indexPifSig == countPifSig) {
                                                    MM.fs.removeFile (filePifSignatures,
                                                        function (result) {
                                                           MM.log('Le fichier '+filePifSignatures+' a bien été effacé');
                                                           
                                                        },
                                                        function (result) {
                                                           MM.log('Le fichier '+filePifSignatures+' n a pas pu étre effacé');
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    });
                                    
                                    
                                },
                                function(result) {
                                    MM.log('Pas de filePifSignatures')
                                }
                            );
                            
                            
                            var fileAvenantSignatures = MM.config.current_site.id+"/"+course+"/"+jsonpif.userid+"_avenantsignatures.json";
                            MM.log('Synchro fileAvenantSignatures : ' + fileAvenantSignatures);
                            MM.fs.findFileAndReadContents(fileAvenantSignatures,
                                function (result) {
                                    avenantSignatureArray = JSON.parse(result);
                                    var countAvenantSig = avenantSignatureArray.length;
                                    var indexAvenantSig = 0;
                                    $.each(avenantSignatureArray, function( indexAvenant, valueAvenant ) {
                                        var file = valueAvenant.split("/");
                                        var options2 = {};
                                        options2.fileKey="file";
                                        options2.fileName = file[file.length-1];
                                        options2.mimeType="image/png";
                                        options2.params = {
                                            course:course
                                        };
                                        options2.chunkedMode = false;
                                        options2.headers = {
                                          Connection: "close"
                                        };
                                        MM.log('Avenant Json:'+valueAvenant+'||'+file[file.length-1]);
                                         MM.fs.fileExists(valueAvenant,
                                            function(path) {
                                                var ft = new FileTransfer();
                                                    ft.upload(
                                                            path,
                                                            MM.config.current_site.siteurl + '/local/session/uploadsignatureavenant.php',
                                                            function(){
                                                              MM.log('Upload Avenant réussi:'+path);
                                                              indexAvenantSig = indexAvenantSig + 1;
                                                              if (indexAvenantSig == countAvenantSig) {
                                                                    MM.fs.removeFile (fileAvenantSignatures,
                                                                        function (result) {
                                                                           MM.log('Le fichier '+fileAvenantSignatures+' a bien été effacé');
                                                                           
                                                                        },
                                                                        function (result) {
                                                                           MM.log('Le fichier '+fileAvenantSignatures+' n a pas pu étre effacé');
                                                                        }
                                                                    );
                                                                }
                                                            },
                                                            function(){
                                                               MM.log('Upload Avenant pas réussi:'+path);
                                                            },
                                                            options2
                                                  );
                                            },
                                            function (path) {
                                                MM.log('Avenant signature existe pas:'+path+'||'+MM.config.current_site.id+"/"+course+"/"+valueAvenant);
                                                indexAvenantSig = indexAvenantSig + 1;
                                                if (indexAvenantSig == countAvenantSig) {
                                                    MM.fs.removeFile (fileAvenantSignatures,
                                                        function (result) {
                                                           MM.log('Le fichier '+fileAvenantSignatures+' a bien été effacé');
                                                           
                                                        },
                                                        function (result) {
                                                           MM.log('Le fichier '+fileAvenantSignatures+' n a pas pu étre effacé');
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    });
                                    
                                    
                                },
                                function(result) {
                                    MM.log('Pas de fileAvenantSignatures')
                                }
                            );
                            
                        });
                        
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
                                                        MM.log( "Session File OK:" + sessionFile + '/' + result);
                                                        var obj = JSON.parse(result);
                                                        var modulesId = obj.modulesId.split(",");
                                                        var modulesName = "";
                                                        var users = obj.users.split(",");
                                                        var indexU=1;
                                                        
                                                        
                                                        /*
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
                                                        */
                                                        var pifscoursejson = JSON.stringify(pifscourse);
                                                        MM.log('check');
                                                        if (obj.notes) {
                                                            var jsonnotes = JSON.stringify(obj.notes);
                                                        } else {
                                                            jsonnotes = "[]";
                                                        }
                                                        
                                                        
                                                        
                                                        MM.log("pifs synchro:"+pifscourse.length);
                                                        MM.log("Json notes:"+jsonnotes);
                                                             
                                                        var data = {
                                                            "userid" : obj.users,
                                                            "moduleid" : obj.modulesId,
                                                            "courseid" : course,
                                                            "starttime" : obj.starttime,
                                                            "endtime" : obj.endtime,
                                                            "modulesstart" : obj.modulesStart,
                                                            "modulesend" : obj.modulesEnd,
                                                            "managerid" : MM.site.get('userid'),
                                                            "pifs" : pifscoursejson,
                                                            "pifsusers" : pifsusers,
                                                            "notes" : jsonnotes
                                                        }
                                        
                                                        //MM.widgets.dialogClose();
                                                                       
                                                        MM.moodleWSCall('local_mobile_update_report_completion_by_userid_courseid', data,
                                                            function(status){
                                                                var sessionTime = new Date(parseInt(obj.starttime));
                                                                
                                                                //var sessionDate = sessionTime.getDate()+"/"+(sessionTime.getMonth()+1)+"/"+sessionTime.getFullYear()+" "+sessionTime.getHours()+":"+sessionTime.getMinutes();
                                                                var sessionDate = ("0" + sessionTime.getDate()).slice(-2)+"/"+("0" + (sessionTime.getMonth() + 1)).slice(-2)+"/"+sessionTime.getFullYear() + ' à ' + ("0" + sessionTime.getHours()).slice(-2)+":"+("0" + sessionTime.getMinutes()).slice(-2);
        
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
                                                                       $.each(participants_users, function( indexU, valueU ) {
                                                                            MM.log('Remove User:'+MM.config.current_site.id + "-" + valueU);
                                                                            MM.db.remove("users",MM.config.current_site.id + "-" + valueU)
                                                                       });
                                                                       
                                                                       //MM.widgets.dialogClose();
                                                                       MM.popMessage(message, {title:'Synchronisation des résultats', autoclose: 0, resizable: false});
                                                                       //sleep(5000);
                                                                       //$("#showSessionL").show();
                                                                       MM.plugins.eleves.showEleves(course);
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
                        
                        
                        //MM.widgets.dialogClose();
                        
                        
                    });
                    
                    //Check Button
                    MM.log("Check Button");
                    var selected = [];
                    
                    
                    $('a#lielevelP').on('touchstart', function(e) {
                        e.preventDefault(); 
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
                                        var jsonNotes = '""';
                                        if (obj.notes)
                                            var getnotes = obj.notes;
                                        
                                        if (getnotes) {
                                            var jsonNotes = JSON.stringify(getnotes);
                                        }
                                        if (jsonNotes == null) {
                                            jsonNotes="[]";
                                        }
                                        MM.fs.createFile(resultFile,
                                            function(fileEntry) {
                                                var content = '{"starttime":"'+starttime+'","users":"'+usersSelected.substr(0, lenghtSelected)+'","notes":'+jsonNotes+'}';
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
                                        $('#synchroR').hide();
                                        //$('#offlineC').show();
                                        $('#offlineC').css('visibility','visible');
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
                        //var startDate = startime.getDate()+"/"+(startime.getMonth()+1)+"/"+startime.getFullYear()+" à "+startime.getHours()+":"+startime.getMinutes();
                        var startDate = ("0" + startime.getDate()).slice(-2)+"/"+("0" + (startime.getMonth() + 1)).slice(-2)+"/"+startime.getFullYear() + ' à ' + ("0" + startime.getHours()).slice(-2)+":"+("0" + startime.getMinutes()).slice(-2);
        
                        var addNote = "Valider la session";
                        var html = '<div id="sessionContent"><table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th>Participants</th><th class="center">Modules</th><th class="center">Actions</th></tr>';

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
                                                        html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td class="center2"><img src="'+ path +'" width="300"><button id="notes2" course="'+course+'" user="'+valueS+'" onclick="notePopin(this)" class="btn grd-grisclair text-blanc">Notes</button></td></tr>';
                                                        if (indexUser == usersS.length) {
                                                            html += '</table></div>';
                                                            MM.log('Session Module Go:');
                                                            MM.widgets.dialog(html, options);
                                                        }
                                                        indexUser++;
                                                    },
                                                    function(path) {
                                                        MM.log('Image Signature NOK:'+fileSignature);
                                                        html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td class="center2"><button id="signature" course="'+course+'" name="signature" userid="'+valueS+'" time="'+timeSession+'" onclick="signaturePopin(this)" class="btn grd-grisfonce text-blanc">Signature</button><button id="notes2" course="'+course+'" user="'+valueS+'" onclick="notePopin(this)" class="btn grd-grisclair text-blanc">Notes</button></td></tr>';
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
                                                html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td><button id="signature" name="signature" userid="'+userG.userid+'" modules="'+modulesId+'" onclick="signaturePopin(this)" class="btn grd-vert text-blanc">Signature</button></td></tr>';
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
                        
                        
                        
                        
                        
                        
                        
                        options.buttons[MM.lang.s("cancel")] = function() {
                            MM.Router.navigate("eleves/" + course );
                            MM.widgets.dialogClose();
                        };
                        
                        
                        options.buttons["Effacer la session"] = function() {
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
                                //$('#offlineC').hide();
                                $('#offlineC').css('visibility','hidden');
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
                        options.buttons["Effacer la session"]['style'] = "modal-button-3";
            
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
                                    var notes = obj.notes;
                                    var jsonNotes = JSON.stringify(notes);
                                    var realusers = $('#stopSessionL').attr('users');
                                    if (jsonNotes == null) {
                                        jsonNotes ="[]";
                                    }
                        
                        
                                    var lenghto = result.length - 1;
                                    var lenghta = modulesId.length - 1;
                                    var lenghtb = moduleStart.length - 1;
                                    var lenghtc = moduleEnd.length - 1;
                                    var content = '{"starttime":"'+startimer+'","users":"'+realusers+'","endtime":"'+endSession+'"' + ',"modulesId":"'+modulesId.substr(0, lenghta)+'"' + ',"modulesStart":"'+moduleStart.substr(0, lenghtb)+'"' + ',"modulesEnd":"'+moduleEnd.substr(0, lenghtc)+'","notes":'+jsonNotes+'}';
                                    
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
                                                    //$('#offlineC').hide();
                                                    $('#offlineC').css('visibility','hidden');
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
                        options.buttons[addNote]['style'] = "modal-button-2";
                        
                        
            
                        
                    
                    });
                    
                    
                    //Pif button
                    $('button#pif').on(MM.clickType, function(e) {
                        MM.log('Pif clicked');
                        var button = $(this);
                        var course = $(this).attr("course");
                        var user = $(this).attr("user");
                        var version = $(this).attr("version");
                        var theuser = MM.db.get('users',parseInt(user));
                        MM.log('pif:'+course+'/'+user);
                        
                        var userspif = MM.db.where('users', {userid:parseInt(user)});
                        var userpif = userspif[0].toJSON();
                        var pifs = userpif.pif;
                        pifscourse = $.grep(pifs, function( el ) {
                                        return el.courseid == course;
                        });
                        
                        MM.log('pifscourse length:'+pifscourse.length);
                        
                        
                        var pifArrayOrg = $(this).attr('pif');
                        MM.log('pifArrayOrg:'+pifArrayOrg);
                        pifArray = pifArrayOrg.replace(/\\"/g, '"');
                        MM.log('pifArray:'+pifArray);
                        
                        if (pifArray == "" || pifArray == "[]") {
                            if (pifscourse.length > 0) {
                                var managerid = pifscourse[0].managerid;
                                var managername = pifscourse[0].managername
                            } else {
                                managerid = MM.config.current_site.userid;
                                managername =MM.config.current_site.fullname;
                            }
                        } else {
                            var pifArray2 = JSON.parse(pifArray);
                            var managerid = pifArray2[0].managerid;
                            var managername = pifArray2[0].managername
                            
                        }
                        MM.log('manager:'+managerid+'/'+managername);
                        
                        
                        
                        var thisuser = MM.db.get("users", MM.config.current_site.id + "-" + user);
                        
                        MM.log(thisuser);
                        
                        var total_duration = 0;
                        
                        
                        
                        var html = '<div id="pifContent"><br/><br/>';
                        html += '<p align="center">Le Protocole Individuel de Formation (PIF) bipartie a bien été initialisée.</p>';
                        html += '<p align="center">Vous pouvez, à présent, former votre stagiaire selon votre rythme.</p><br/><br/>';
                        html += '<p align="center"><button course="'+course+'" user="'+user+'" version="'+version+'" class="modal-button-5" style="width: 25%">Voir le PIF</button><button onclick="modifierPif(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"  version="'+version+'" class="modal-button-6" style="width: 25%">Modifier le PIF</button></p>';
                        html += '<br/><br/><br/><p align="center">Une fois l\'ensemble du parcours de formation finalisée, vous pourrez compléter la grille<br/> de positionnement ci-dessous en aval de la formation.</p>';
                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
                        html += '<tr><td><span class="pifgris">GRILLE DE POSITIONNEMENT</span> <span class="pifnoir">AMONT :</span></td><td> <button class="modal-button-1">Voir</button></td></tr>';
                        html += '<tr><td><span class="pifgris">GRILLE DE POSITIONNEMENT</span> <span class="pifnoir">AVAL :</span></td><td> <button class="modal-button-5">Compléter</button></td></tr>';
                        html += '</table>';
                        
                        var options = {
                            title: 'Stagiaire '+userpif.fullname+'<div class="closedialog"><a href="javascript:void(0)" onclick="closeDialog('+course+','+user+')">X</a></div>',
                            width: "98%",
                            marginTop: "10%",
                            buttons: {}
                        };
                        
                        MM.widgets.dialog(html, options);
                        
                        if (pifArray != "") {
                            $("button#modifierpif").click();
                        }
                        
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
                        
                        var resultFile =  MM.config.current_site.id + "/" + course + "/result/session.json";
                        var sessionnotes;
                        MM.fs.findFileAndReadContents(resultFile,
                            function (result) {
                                    var obj = JSON.parse(result);
                                    if (obj.notes) {
                                       sessionnotes = obj.notes;
                                    }
                                    MM.log('Sessionnotes OK:'+sessionnotes);
                                    manageNotes(course,user,theuser,resultFile,sessionnotes,button,0,1);
                                    
                            },
                            function (result) {
                                MM.log('Sessionnotes NOK:'+sessionnotes);
                                manageNotes(course,user,theuser,resultFile,sessionnotes,button,0,0);
                            }
                        );
                        
                        
                            
                        
                        
                        
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
                                                //$('#offlineC').hide();
                                                $('#offlineC').css('visibility','hidden');
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
                                              //$('#offlineC').show();
                                              $('#offlineC').css('visibility','visible');
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
                "options[2][name]": "userfields",
                "options[2][value]": "email,firstname,lastname",
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
                    },
                    getFromCache: false,
                    saveToCache: true
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


function manageNotes(course,user,theuser,resultFile,sessionnotes,button,button2,sessionOk) {
    
    var usersnotes = MM.db.where('users', {userid:parseInt(user)});
    var usernotes = usersnotes[0].toJSON();
    var notes = usernotes.notes;
    notescourse = $.grep(notes, function( el ) {
                    return el.courseid == course;
    });
    MM.log('notescourse length:'+notescourse.length);
    
    var thisuser = MM.db.get('users',usernotes.id);
    var sessionnotes2;
    
    MM.log('notescourse length:'+notescourse.length);
    if (sessionnotes) {
        sessionnotes2 = $.grep(sessionnotes, function( el ) {
                    return el.courseid == course && el.userid == user ;
        });
        sessionnotes2.sort(function(a, b) {
            return parseFloat(a.notetime) - parseFloat(b.notetime);
        });
        //On compare les notes de session avec les notes dans le cache
        for (var i=0;i<sessionnotes2.length;i++) {
            for (var k=0;k<notescourse.length;k++) {
                MM.log('Parcours Session/Cache :'+sessionnotes2.length+'/'+i+'/'+k);
                
                if (sessionnotes2[i].noteid ==  notescourse[k].noteid) {
                    if (sessionnotes2[i].action == "supprimer") {
                         MM.log('Suppression note Cache par note Session:'+notescourse[k].noteid+' par '+sessionnotes2[i].noteid);
                         notescourse.splice(k,1);
                         sessionnotes2.splice(i,1);
                         i=-1;
                         break;
                    }
                    if (sessionnotes2[i].action == "modifier") {
                         MM.log('Modification note Cache par note Session');
                         notescourse[k].note = sessionnotes2[i].note;
                         sessionnotes2.splice(i,1);
                         i=-1;
                         break;
                         
                    }
                }
            }
        }
        
        //On compare les notes de session avec les autres notes de session
        for (i=0;i<sessionnotes2.length;i++) {
            for (k=0;k<sessionnotes2.length;k++) {
                MM.log('Parcours Session/Session :'+sessionnotes2.length+'/'+i+'/'+k);
                if (sessionnotes2[i].noteid ==  sessionnotes2[k].noteid) {
                    if (sessionnotes2[k].action == "supprimer") {
                         MM.log('Suppression note Session par note Session:'+sessionnotes2[k].noteid + 'par' + sessionnotes2[i].noteid );
                         sessionnotes2.splice(i,1);
                         sessionnotes2.splice(k-1,1);
                         i=-1;
                         
                         break;
                    }
                    if (sessionnotes2[k].action == "modifier") {
                         MM.log('Modification note Session par note Session');
                         sessionnotes2[i].note = sessionnotes2[k].note;
                         sessionnotes2[i].notetime = sessionnotes2[k].notetime;
                         sessionnotes2.splice(k,1);
                         i=-1;
                         break;
                    }
                }
            }
        }
        //On réordonne les notes par date desc
        sessionnotes2.sort(function(a, b) {
            return parseFloat(b.notetime) - parseFloat(a.notetime);
        });
        
        
    }
    
    MM.log('sessionnotes2:'+sessionnotes2);
    var addNote = "Valider";
    //var html = '<div id="sessionContent"><table width="100%" border="1"><tr><td>Date</td><td>Note</td><td>Actions</td></tr>';
    var html = '<div id="sessionContent"><table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr align="center"><th>Ajoutée le</th><th>Note</th><th class="center">Actions</th></tr>';
    
    if (sessionnotes2 && notescourse)
        var mergednotes=sessionnotes2.concat(notescourse);
    if (!sessionnotes2 && notescourse)
        mergednotes = notescourse;
    if (sessionnotes2 && !notescourse)
        mergednotes = sessionnotes2;
    
    MM.log('mergednotes:'+mergednotes);
    
    mergednotes.forEach(function(notecourse) {
        MM.log('notecourse:'+notecourse.noteid+'/'+notecourse.note+'/'+notecourse.action);
        var datenote =  new Date(notecourse.notetime*1000);
        //var datenote = new Date(notecourse.notetime*1000).toISOString().substr(0, 19);
        var notetime = ("0" + datenote.getDate()).slice(-2)+"/"+("0" + (datenote.getMonth() + 1)).slice(-2)+"/"+datenote.getFullYear() + ' à ' + ("0" + datenote.getHours()).slice(-2)+":"+("0" + datenote.getMinutes()).slice(-2);
        if (sessionOk) {
            if (button2)
                var backTo = 1;
            else
                backTo = 0;
            html+='<tr><td style="height:40px;width:100px">'+notetime+'</td><td>'+nl2br(decodeURI(notecourse.note))+'</td><td class="center2"><button id="noteM" user="'+user+'" course="'+notecourse.courseid+'" session="'+notecourse.sessionid+'" message="'+notecourse.note+'" note="'+notecourse.noteid+'" onclick="ModifierNotePopin(this,'+backTo+')" class="btn grd-orange text-blanc" >Modifier</button><button id="noteS" user="'+user+'" course="'+notecourse.courseid+'" session="'+notecourse.sessionid+'" note="'+notecourse.noteid+'" onclick="SupprimerNotePopin(this,'+backTo+')" class="btn grd-rouge text-blanc">Supprimer</button></td></tr>';
        } else {
            html+='<tr><td style="height:40px;width:100px">'+notetime+'</td><td>'+nl2br(decodeURI(notecourse.note))+'</td><td class="center2">Pour pouvoir modifier ou supprimer une note il faut préalablement démarrer une session</td></tr>';
        }
    });
    
    html+='</table></div>';
    MM.log('html:'+html);
    
    var options = {
        title: 'Notes pour '+usernotes.fullname,
        width: "90%",
        buttons: {}
    };
    
    
    
    
    if (button2) {
        options.buttons["Fermer"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            if (button2) {
                $('#stopSessionL').click();
            }
        };
        options.buttons["Fermer"]['style'] = "modal-button-1";
        options.buttons["Ajouter une note"] = function() {
            
            MM.widgets.dialogClose();
            
            var html2 = '<div id="sessionContent"><table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
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
                
                
                
                MM.fs.findFileAndReadContents(resultFile,
                    function (result) {
                            var obj = JSON.parse(result);
                            var starttime = obj.starttime;
                            var users = obj.users;
                            
                            if (obj.notes)
                                var getnotes = obj.notes;
                            
                            var idalea = chaine_aleatoire(12);
                            if (getnotes) {
                                getnotes.unshift({"courseid":course,"sessionid":"","noteid":idalea,"notetime":Math.floor(Date.now() / 1000),"note":encodeURI($('#thenote').val()),"userid":user,"action":"ajouter"});
                                var jsonNotes = JSON.stringify(getnotes);
                            }
                            else 
                                var jsonNotes = '[{"courseid":'+course+',"sessionid":"","noteid":'+idalea+',"notetime":'+Math.floor(Date.now() / 1000)+',"note":"'+encodeURI($("#thenote").val())+'","userid":'+user+',"action":"ajouter"}]';
                            
                            if (jsonNotes == null) {
                                jsonNotes="[]";
                            }
                            
                            MM.log('jsonNotes:'+jsonNotes);
                            
                            MM.fs.createFile(resultFile,
                                function(fileEntry) {
                                    var content = '{"starttime":"'+starttime+'","users":"'+users+'","notes":'+jsonNotes+'}';
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
                                   MM.log('Recreate Session : NOK');
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
            
    } else {
        
        options.buttons["Fermer"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            if (button2) {
                $('#stopSessionL').click();
            }
        };
        options.buttons["Fermer"]['style'] ="modal-button-1";
        MM.widgets.dialog(html, options);
    }
        
        
}



function notePopin( elem ) {
    
    MM.log('notes2 clicked');
    MM.widgets.dialogClose();
    var button=$("#stopSessionL");
    //e.preventDefault();
    var course = $(elem).attr("course");
    var user = $(elem).attr("user");
    var theuser = MM.db.get('users',parseInt(user));
    MM.log('Notes:'+course+'/'+user);
    
    var resultFile =  MM.config.current_site.id + "/" + course + "/result/session.json";
    var sessionnotes;
    MM.fs.findFileAndReadContents(resultFile,
        function (result) {
                MM.log('JSON Session:' + result);
                var obj = JSON.parse(result);
                if (obj.notes) {
                   sessionnotes = obj.notes;
                }
                MM.log('Sessionnotes OK:'+sessionnotes);
                manageNotes(course,user,theuser,resultFile,sessionnotes,button,1,1);
                
        },
        function (result) {
            MM.log('Sessionnotes NOK:'+sessionnotes);
            manageNotes(course,user,theuser,resultFile,sessionnotes,button,1,1);
        }
    );
}



function SupprimerNotePopin( elem,backTo ) {
    
    MM.log('SupprimerNotePopin');
    MM.widgets.dialogClose();
    var course = $(elem).attr("course");
    var note = $(elem).attr("note");
    var user = $(elem).attr("user");
    var session = $(elem).attr("session");
    if (!backTo)
        var button=$("button#notes[user='"+user+"']");
    else
        button=$("#stopSessionL");
    var resultFile =  MM.config.current_site.id + "/" + course + "/result/session.json";
    var sessionnotes;
    
    MM.fs.findFileAndReadContents(resultFile,
        function (result) {
                var obj = JSON.parse(result);
                if (obj.notes) {
                   var sessionnotes = obj.notes;
                }
                var starttime = obj.starttime;
                var users = obj.users;
                
                if (sessionnotes) {
                    var sessionnotes2 = $.grep(sessionnotes, function( el ) {
                                return el.noteid == note ;
                    });
                }
    
                MM.popConfirm( "Etes vous sûr de vouloir supprimer cette note ?",
                    function() {
                        MM.log('Confirmation Suppression Note');
                        if (sessionnotes) {
                            sessionnotes.unshift({"courseid":course,"sessionid":session,"noteid":note,"notetime":Math.floor(Date.now() / 1000),"note":"","userid":user,"action":"supprimer"});
                            var jsonNotes = JSON.stringify(sessionnotes);
                        }
                        else 
                            var jsonNotes = '[{"courseid":'+course+',"sessionid":'+session+',"noteid":'+note+',"notetime":'+Math.floor(Date.now() / 1000)+',"note":"","userid":'+user+',"action":"supprimer"}]';
                        
                        if (jsonNotes == null) {
                            jsonNotes="[]";
                        }
                        MM.log('jsonNotes:'+jsonNotes);
                                
                        MM.fs.createFile(resultFile,
                            function(fileEntry) {
                                var content = '{"starttime":"'+starttime+'","users":"'+users+'","notes":'+jsonNotes+'}';
                                MM.log('Recrate Session:'+content);
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
                               MM.log('Recreate Session : NOK');
                               button.click();
                               
                            }
                        );
                    },
                    function() {
                        MM.log('Annulation Suppression Note');
                        button.click();
                    }
                );
                
        },
        function (result) {
            MM.log('Sessionnotes NOK:'+sessionnotes);
            button.click();
        }
    );
    
}


function ModifierNotePopin( elem,backTo ) {
    
    MM.log('ModifierNotePopin');
    MM.widgets.dialogClose();
    var course = $(elem).attr("course");
    var note = $(elem).attr("note");
    var user = $(elem).attr("user");
    var session = $(elem).attr("session");
    var message = decodeURI($(elem).attr("message"));
    if (!backTo)
        var button=$("button#notes[user='"+user+"']");
    else
        button=$("#stopSessionL");
    
    var resultFile =  MM.config.current_site.id + "/" + course + "/result/session.json";
    var sessionnotes;
    var usersnotes = MM.db.where('users', {userid:parseInt(user)});
    var usernotes = usersnotes[0].toJSON();
    
    var html2 = '<div id="sessionContent"><table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
    html2+='<tr><td style="height:40px"><textarea id="thenote" cols="20" rows="5" name="thenote">'+message+'</textarea></td></tr>';
    html2+='<script>$("#thenote").focus();</script>';
    html2+='</table></div>';
    
    var options2 = {
        title: 'Modifier une note pour '+usernotes.fullname,
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
        MM.log('Valider Modification Note');
        
        
        
        MM.fs.findFileAndReadContents(resultFile,
            function (result) {
                    var obj = JSON.parse(result);
                    var starttime = obj.starttime;
                    var users = obj.users;
                    
                    if (obj.notes)
                        var getnotes = obj.notes;
                    
                    var idalea = chaine_aleatoire(12);
                    if (getnotes) {
                        getnotes.unshift({"courseid":course,"sessionid":session,"noteid":note,"notetime":Math.floor(Date.now() / 1000),"note":encodeURI($('#thenote').val()),"userid":user,"action":"modifier"});
                        var jsonNotes = JSON.stringify(getnotes);
                    }
                    else 
                        var jsonNotes = '[{"courseid":'+course+',"sessionid":'+session+',"noteid":'+note+',"notetime":'+Math.floor(Date.now() / 1000)+',"note":"'+encodeURI($("#thenote").val())+'","userid":'+user+',"action":"modifier"}]';
                    
                    if (jsonNotes == null) {
                        jsonNotes="[]";
                    }
                    
                    $(elem).attr("message",encodeURI($('#thenote').val()));
                    MM.log('jsonNotes:'+jsonNotes);
                    
                    MM.fs.createFile(resultFile,
                        function(fileEntry) {
                            var content = '{"starttime":"'+starttime+'","users":"'+users+'","notes":'+jsonNotes+'}';
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
                           MM.log('Recreate Session : NOK');
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

function nl2br (str, is_xhtml) {   
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
}

function checkthispif(elem) {
    MM.log('checkbox pif clicked');
    var content = $(elem).attr("content");
    if($(elem).prop('checked')) {
        $('input[name="a_'+content+'"]').prop('disabled', false);
    } else {
        $('input[name="a_'+content+'"]').prop('disabled', true);
    }
}

// Génération d'une chaine aléatoire
function chaine_aleatoire(plength)
{
	var temp="";
    var keylist="123456789";
	for (var i=0;i<plength;i++) {
        temp+=keylist.charAt(Math.floor(Math.random()*keylist.length));
    }
	return temp
}


function validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,date_version) {
    MM.log('validerPif:'+userspif+'/'+course+'/'+managerid+'/'+managername);
    if (userspif && userspif != "") {
        var userpif = userspif[0].toJSON();
        //MM.log('userpif:'+userpif);
        MM.log('pifs:'+pifs);
        pifs2 = $.grep(pifs, function( el ) {
                MM.log('grep:'+el.courseid+'/'+course);
                return el.courseid != course;
        });
        
        
        
        MM.log('pifs2 length:'+pifs2.length);
        MM.log('thisuser:'+thisuser);
        
        
        
        
        var b;
        var a;
        var scormid;
        var avant = 0;
        var apres = 0;
        var valider = 1;
        var pifs3 = new Array();
        $('input#checkboxpif').each(function(index) {
          if ($(this).attr('genre') == 'b') {
            scormid = $(this).attr('content');
            if ($(this).is(':checked')) {
                a = 1;
                avant = 1;
            } else {
                a = 0;
            }
          }
          if ($(this).attr('genre') == 'a') {
            if ($(this).is(':checked')) {
                b = 1;
                apres = 1;
            } else {
                b = 0;
            }
            var obj = {version:version,date_version:date_version,courseid:course,scormid:scormid,begin:a,end:b,managerid:managerid,managername:managername};
            if (pifsignature1 == 0) {
                obj.signature_avant_manager = 0;
            } else {
                obj.signature_avant_manager = 1;
            }
            if (pifsignature2 == 0) {
                obj.signature_avant_stagiaire = 0;
            } else {
                obj.signature_avant_stagiaire = 1;
            }
            if (pifsignature3 == 0) {
                obj.signature_apres_manager = 0;
            } else {
                obj.signature_apres_manager = 1;
            }
            if (pifsignature4 == 0) {
                obj.signature_apres_stagiaire = 0;
            } else {
                obj.signature_apres_stagiaire = 1;
            }
            
            pifs2.push(obj);
            pifs3.push({version:version,date_version:date_version,courseid:course,scormid:scormid,begin:a,end:b,managerid:managerid,managername:managername});
          }
          MM.log('checkboxes:'+$(this).attr('genre')+'/'+$(this).attr('content')+'/'+$(this).is(':checked')  );
        });
        var pifbutton = JSON.stringify(pifs3);
        pifbutton = pifbutton.replace(/"/g, '\\"');
        MM.log('pifbutton:'+pifbutton);
        $('button#pif[user="'+userpif.userid+'"]').attr('pif',pifbutton);
                            
        //MM.log('pifs length:'+pifs2.length)
        //MM.log('pif:'+pifs2[0]+'/'+pifs2[0].scormid);
        
        
        var options = {
            title: '',
            buttons: {}
        };
        
        options.buttons["Fermer"] = function() {
            MM.widgets.dialogClose();
            MM.log("Dialog:"+userpif.userid);
            $('button#pif[user="'+userpif.userid+'"]').click();
        };
        
                        
        if (valider == 1 && avant == 1 && (pifsignature1 == 0 || pifsignature2 == 0)) {
            MM.popMessage("Veuillez signer au bas du tableau, pour valider les compétences à développer dans le cadre du parcours de formation.",options);
            valider = 0;
        }
        if (valider == 1 && apres == 1 && (pifsignature3 == 0 || pifsignature4 == 0)) {
            MM.popMessage("Veuillez signer au bas du tableau, pour valider les compétences acquises à l'issue du parcours de formation.",options);
            valider = 0;
        }
        if (valider == 1){
                    $('button#pif[user="'+userpif.userid+'"]').attr('pif','');
                    MM.log("Save PIF1:"+pifs2);
                    thisuser.save({pif:pifs2});
                    version = parseInt(version) + 1;
                    $('button#pif[user="'+userpif.userid+'"]').attr('version',version);

        }
        
        
    }
    //MM.Router.navigate("eleves/" + course );
    if (valider == 1) {
        MM.log("Save PIF2:");
        MM.widgets.dialogClose();
        $('button#pif[user="'+userpif.userid+'"]').click();
    }
    
}



//Modifier le Pif button
                    
function modifierPif(button,user,course,version) {
    
    MM.log('Modifier pif clicked');
    
    var button = button;
    //e.preventDefault();
    var course = course;
    var courseId = course;
    var user = user;
    var version = version;
    var theuser = MM.db.get('users',parseInt(user));
    MM.log('pif:'+course+'/'+user+'/'+version);
    
    var userspif = MM.db.where('users', {userid:parseInt(user)});
    var userpif = userspif[0].toJSON();
    var pifs = userpif.pif;
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == course;
    });
    MM.log('pifscourse length:'+pifscourse.length);
    
    
    //var pifArray = pif;
    var pifArray = $('button#pif[user="'+userpif.userid+'"]').attr('pif');
    MM.log('pifArray:'+pifArray);
    pifArray = pifArray.replace(/\\"/g, '"');
    MM.log('pifArray:'+pifArray);
    
    if (pifArray == "" || pifArray == "[]") {
        if (pifscourse.length > 0) {
            var managerid = pifscourse[0].managerid;
            var managername = pifscourse[0].managername
        } else {
            managerid = MM.config.current_site.userid;
            managername =MM.config.current_site.fullname;
        }
    } else {
        var pifArray2 = JSON.parse(pifArray);
        var managerid = pifArray2[0].managerid;
        var managername = pifArray2[0].managername
        
    }
    MM.log('manager:'+managerid+'/'+managername);
    
    
    
    var thisuser = MM.db.get("users", MM.config.current_site.id + "-" + user);
    
    MM.log(thisuser);
    
    var total_duration = 0;
    
    var addNote = "Valider";
    var html = '<div id="pifContent">';
    if (version > 1) {
        html+= '<div class="avenant">Vous pouvez modifier les compétences du stagiaire à acquérir ou qui ont été acquises dans le cadre du parcours de formation.<br/>Ces compétences figurent dans l\'article 3 du PIF (repris ci-dessous).<br/>Pour chaque modification apportée à l\'article 3, il vous sera demandé de signer un avenant avec votre stagiaire.</div>';
    }
    html+= '<h1><b>Article 3 – Le besoin de compétences à développer et visas des compétences acquises –</b></h1>';
    html+= '<p>La grille suivante est un outil simple à remplir avant et à la fin de la formation, afin de formaliser l\'individualisation du parcours de formation et d\'en vérifier les acquis. Il constitue donc le référentiel des compétences visées, des objectifs pédagogiques associés, et des compétences acquises au terme du parcours de formation individualisé. Il n\'y a pas de pré requis pour cette formation.</p>';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center"><b>A remplir avant la formation</b></th><th>&nbsp;</th><th class="center"><b>A remplir à l’issue du parcours de formation</b></th></tr><tr><td class="center2"><b>Compétences à développer dans le cadre du parcours de formation</b></td><td class="center2"><b>Intitulé des séquences pédagogiques</b></td><td class="center2"><b>Compétences acquises à l’issue du parcours de formation</b></td></tr>';
    
    var local_contents = MM.db.where("contents",{courseid : courseId, site: MM.config.current_site.id});
    local_contents.forEach(function(local_content) {
         var content = local_content.toJSON();
         var unchecked = 0;
         if (content.modname == "scorm") {
            html+='<tr><td style="height:40px" class="center2"><input onclick="checkthispif(this)" type="checkbox" id="checkboxpif" genre="b" content="'+content.contentid+'" name="b_'+content.contentid+'"';
            
            
            if (pifArray == "") {
            
                //MM.log('pifscourse:'+pifscourse+'/'+pifscourse.length+'/'+pifscourse[0]+'/'+pifscourse[0].scormid);
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
                    total_duration += content.pif_duration;
                } else {
                    unchecked = 1;
                }
                html +='></td><td  class="center2">'+content.name+'</td><td  class="center2"><input id="checkboxpif" genre="a" content="'+content.contentid+'" type="checkbox" name="a_'+content.contentid+'"';
                 
                pifscorme = $.grep(pifscourse, function( el ) {
                        return el.scormid == content.contentid && el.end == 1;
                });
                MM.log('pifscorme length:'+pifscorme.length);
                if (pifscorme.length>0) {
                    html+=' checked="checked"';
                }
                if (unchecked) {
                    html+=' disabled="true"'
                }
                html +='></td></tr>';
                
            } else {
                
                
                //MM.log('PIF Button Attr:'+pifArray2+'/'+pifArray2.length+'/'+pifArray2[0]+'/'+pifArray2[0].scormid+'/'+content.contentid);
                
                pifscormb = $.grep(pifArray2, function( el ) {
                    return el.scormid == content.contentid && el.begin == 1;
                });
                
                if (pifscormb.length>0) {
                    html+=' checked="checked"';
                    total_duration += content.pif_duration;
                } else {
                    unchecked = 1;
                }
                html +='></td><td  class="center2">'+content.name+'</td><td  class="center2"><input id="checkboxpif" genre="a" content="'+content.contentid+'" type="checkbox" name="a_'+content.contentid+'"';
                 
                pifscorme = $.grep(pifArray2, function( el ) {
                        return el.scormid == content.contentid && el.end == 1;
                });
                if (pifscorme.length>0) {
                    html+=' checked="checked"';
                }
                if (unchecked) {
                    html+=' disabled="true"'
                }
                html +='></td></tr>';
                
            }
         }
    });
    
    html +='</table><br/><br/>';
    
    
    if (pifArray != ""){
        $('button#pif[user="'+userpif.userid+'"]').attr("pif","");
    }
    
    var pifsignature1 = 0;
    var pifsignature2 = 0;
    var pifsignature3 = 0;
    var pifsignature4 = 0;
    
    var avenantsignature1 = 0;
    var avenantsignature2 = 0;
    
    var options = {
        title: 'Modifier le PIF du stagiaire : '+userpif.fullname,
        width: "98%",
        marginTop: "10%",
        buttons: {}
    };
    
    options.buttons[MM.lang.s("cancel")] = function() {
        MM.Router.navigate("eleves/" + course );
        MM.widgets.dialogClose();
        $('button#pif[user="'+userpif.userid+'"]').click();
    };
    
    
    
    if (version == 1) {

        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center" colspan="2"><b>AVANT LA FORMATION<br/>Signer pour valider les compétences à développer</b></th></tr>';
        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';
        
        
        
        var fileSignature1 = MM.config.current_site.id+"/"+course+"/"+user+"_signature_manager_avant.png";
        var fileSignature2 = MM.config.current_site.id+"/"+course+"/"+user+"_signature_stagiaire_avant.png";
        var fileSignature3 = MM.config.current_site.id+"/"+course+"/"+user+"_signature_manager_apres.png";
        var fileSignature4 = MM.config.current_site.id+"/"+course+"/"+user+"_signature_stagiaire_apres.png";
        
        var d = new Date();
        var today = parseInt(d.getTime()/1000);
                                
    
        MM.fs.findFileAndReadContents(fileSignature1,
            function(path) {
                pifsignature1 = path;
                MM.log('Image Signature Manager avant OK:'+fileSignature1);
                html += '<tr><td class="center2"><img src="'+ path +'" width="300"></td>';
                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                MM.fs.findFileAndReadContents(fileSignature2,
                    function(path) {
                        pifsignature2 = path;
                        MM.log('Image Signature Stagiaire avant OK 1:'+fileSignature2);
                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                        html += '</table><br/><br/>';
                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center" colspan="2"><b>APRES LA FORMATION<br/>Signer pour valider les compétences acquises</b></th></tr>';
                        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';
                                        
                        MM.fs.findFileAndReadContents(fileSignature3,
                            function(path) {
                                pifsignature3 = path;
                                MM.log('Image Signature Manager aprés OK 1:'+fileSignature3);
                                html += '<tr><td class="center2"><img src="'+ path +'" width="300"></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK 1:'+fileSignature4);
                                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                        
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK 1:'+fileSignature4);
                                        html += '<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                        
                                    }
                                );
                            },
                            function(path) {
                                MM.log('Image Signature Manager aprés NOK 1:'+fileSignature3);
                                html += '<tr><td class="center2"><button course="'+courseId+'" id="signature_manager_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK 1:'+fileSignature4);
                                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                        
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK 1:'+fileSignature4);
                                        html += '<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                        
                                    }
                                );
                            }
                        );
                
                    },
                    function(path) {
                        MM.log('Image Signature Stagiaire avant NOK 1:'+fileSignature2);
                        html += '<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                        html += '</table><br/><br/>';
                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center" colspan="2"><b>APRES LA FORMATION<br/>Signer pour valider les compétences acquises</b></th></tr>';
                        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';
                        
                        MM.fs.findFileAndReadContents(fileSignature3,
                            function(path) {
                                pifsignature3 = path;
                                MM.log('Image Signature Manager aprés OK:'+fileSignature3);
                                html += '<tr><td class="center2"><img src="'+ path +'" width="300"></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                       
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                        
                                    }
                                );
                            },
                            function(path) {
                                MM.log('Image Signature Manager aprés NOK:'+fileSignature3);
                                html += '<tr><td class="center2"><button course="'+courseId+'" id="signature_manager_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                    }
                                );
                            }
                        );
                    }
                );
            },
            function(path) {
                MM.log('Image Signature Manager avant NOK:'+fileSignature1);
                html += '<tr><td class="center2"><button course="'+courseId+'" id="signature_manager_avant" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
        
                MM.fs.findFileAndReadContents(fileSignature2,
                    function(path) {
                        pifsignature2 = path;
                        MM.log('Image Signature Stagiaire avant OK 2:'+fileSignature2);
                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        html += '</table><br/><br/>';
                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center" colspan="2"><b>APRES LA FORMATION<br/>Signer pour valider les compétences acquises</b></th></tr>';
                        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';
                        
                        MM.fs.findFileAndReadContents(fileSignature3,
                            function(path) {
                                pifsignature3 = 1;
                                MM.log('Image Signature Manager aprés OK:'+fileSignature3);
                                html += '<tr><td class="center2"><img src="'+ path +'" width="300"></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                    }
                                );
                            },
                            function(path) {
                                MM.log('Image Signature Manager aprés NOK:'+fileSignature3);
                                html += '<tr><td class="center2"><button course="'+courseId+'" id="signature_manager_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                    }
                                );
                            }
                        );
                    },
                    function(path) {
                        MM.log('Image Signature Stagiaire avant NOK 2:'+fileSignature2);
                        html += '<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        html += '</table><br/><br/>';
                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center" colspan="2"><b>APRES LA FORMATION<br/>Signer pour valider les compétences acquises</b></th></tr>';
                        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';              
                    
                        MM.fs.findFileAndReadContents(fileSignature3,
                            function(path) {
                                pifsignature3 = path;
                                MM.log('Image Signature Manager aprés OK:'+fileSignature3);
                                html += '<tr><td class="center2"><img src="'+ path +'" width="300"></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                    }
                                );
                            },
                            function(path) {
                                MM.log('Image Signature Manager aprés NOK:'+fileSignature3);
                                html += '<tr><td class="center2"><button course="'+courseId+'" id="signature_manager_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    
    } else {
        
        var today = new Date();
        var now = parseInt(today.getTime()/1000);
        var dd = today.getDate();

        var mm = today.getMonth()+1; 
        var yyyy = today.getFullYear();
        if(dd<10) 
        {
            dd='0'+dd;
        } 
        
        if(mm<10) 
        {
            mm='0'+mm;
        } 
        var current = dd+'/'+mm+'/'+yyyy+' à ' + today.getHours() + ':' + today.getMinutes();

        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><td class="center2" colspan="2"><b>AVENANT</b><br/><br/>Je certifie vouloir apporter ces dernières modifications à l\'article 3 du Protocole Individuel de Formation (PIF) bipartite et le stagiaire bénéficiaire en a bien pris connaissance.<br/><br/>Modifié le '+current+'<br/><br/><br/></td></tr><tr><th class="center" colspan="2"><b>Signez pour valider les modifications apportées au PIF</b></th></tr>';
        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';
        
        var fileAvenant1 = MM.config.current_site.id+"/"+course+"/"+user+"_"+version+"_signature_manager.png";
        var fileAvenant2 = MM.config.current_site.id+"/"+course+"/"+user+"_"+version+"_signature_stagiaire.png";
        
        MM.fs.findFileAndReadContents(fileAvenant1,
            function(path) {
                avenantsignature1 = path;
                MM.log('Image Signature Manager Avenant OK Version :'+version+' : '+fileAvenant1);
                html += '<tr><td class="center2"><img src="'+ path +'" width="300"></td>';
                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
        
                MM.fs.findFileAndReadContents(fileAvenant2,
                    function(path) {
                        avenantsignature2 = path;
                        MM.log('Image Signature Stagiaire Avenant OK Version :'+version+' : '+fileAvenant2);
                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                        html += '</table></div>';
                        
                        options.buttons["Valider"] = function() { validerAvenant(userspif,pifs,course,thisuser,1,1,1,1,managerid,managername,version,now,avenantsignature1,avenantsignature2); };
                        options.buttons["Valider"]["style"] = "modal-button-2";
                        
                        MM.widgets.dialog(html, options);
                        
                    },
                    function(path) {
                        MM.log('Image Signature Stagiaire Avenant NOK Version :'+version+' : '+fileAvenant2);
                        html += '<td class="center2"><button version="'+version+'" course="'+courseId+'" id="signature_stagiaire" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signatureAvenantPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                        html += '</table></div>';
                        
                        options.buttons["Valider"] = function() { validerAvenant(userspif,pifs,course,thisuser,1,1,1,1,managerid,managername,version,now,avenantsignature1,avenantsignature2); };
                        options.buttons["Valider"]["style"] = "modal-button-2";
                        
                        MM.widgets.dialog(html, options);
                        
                    }
                );
            },
            function(path) {
                MM.log('Image Signature Manager Avenant NOK Version :'+version+' : '+fileAvenant1);
                html += '<tr><td class="center2"><button version="'+version+'" course="'+courseId+'" id="signature_manager" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signatureAvenantPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
        
                MM.fs.findFileAndReadContents(fileAvenant2,
                    function(path) {
                        avenantsignature2 = path;
                        MM.log('Image Signature Stagiaire Avenant OK Version :'+version+' : '+fileAvenant2);
                        html += '<td class="center2"><img src="'+ path +'" width="300"></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                        html += '</table></div>';
                        
                        options.buttons["Valider"] = function() { validerAvenant(userspif,pifs,course,thisuser,1,1,1,1,managerid,managername,version,now,avenantsignature1,avenantsignature2); };
                        options.buttons["Valider"]["style"] = "modal-button-2";
                        
                        MM.widgets.dialog(html, options);
                        
                    },
                    function(path) {
                        MM.log('Image Signature Stagiaire Avenant NOK Version :'+version+' : '+fileAvenant2);
                        html += '<td class="center2"><button version="'+version+'" course="'+courseId+'" id="signature_stagiaire" name="signature" userid="'+user+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signatureAvenantPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                        html += '</table></div>';
                        
                        options.buttons["Valider"] = function() { validerAvenant(userspif,pifs,course,thisuser,1,1,1,1,managerid,managername,version,now,avenantsignature1,avenantsignature2); };
                        options.buttons["Valider"]["style"] = "modal-button-2";
                        
                        MM.widgets.dialog(html, options);
                        
                    }
                );
            }
        );
        
        
        
    }
    
    
    
}

function validerAvenant(userspif,pifs,course,thisuser,pifsignature1,pifsignature2,pifsignature3,pifsignature4,managerid,managername,version,date_version,avenantsignature1,avenantsignature2) {
    MM.log('validerAvenant:'+userspif+'/'+course+'/'+managerid+'/'+managername);
    if (userspif && userspif != "") {
        var userpif = userspif[0].toJSON();
        //MM.log('userpif:'+userpif);
        MM.log('pifs:'+pifs);
        pifs2 = pifs;
        /*
        pifs2 = $.grep(pifs, function( el ) {
                MM.log('grep:'+el.courseid+'/'+course);
                return el.courseid != course;
        });
        */
        
        
        MM.log('pifs2 length:'+pifs2.length);
        MM.log('thisuser:'+thisuser);
        
        
        var b;
        var a;
        var scormid;
        var avant = 0;
        var apres = 0;
        var valider = 1;
        var pifs3 = new Array();
        $('input#checkboxpif').each(function(index) {
          if ($(this).attr('genre') == 'b') {
            scormid = $(this).attr('content');
            if ($(this).is(':checked')) {
                a = 1;
                avant = 1;
            } else {
                a = 0;
            }
          }
          if ($(this).attr('genre') == 'a') {
            if ($(this).is(':checked')) {
                b = 1;
                apres = 1;
            } else {
                b = 0;
            }
            var obj = {version:version,date_version:date_version,courseid:course,scormid:scormid,begin:a,end:b,managerid:managerid,managername:managername};
            if (pifsignature1 == 0) {
                obj.signature_avant_manager = 0;
            } else {
                obj.signature_avant_manager = 1;
            }
            if (pifsignature2 == 0) {
                obj.signature_avant_stagiaire = 0;
            } else {
                obj.signature_avant_stagiaire = 1;
            }
            if (pifsignature3 == 0) {
                obj.signature_apres_manager = 0;
            } else {
                obj.signature_apres_manager = 1;
            }
            if (pifsignature4 == 0) {
                obj.signature_apres_stagiaire = 0;
            } else {
                obj.signature_apres_stagiaire = 1;
            }
            
            pifs2.push(obj);
            pifs3.push({version:version,date_version:date_version,courseid:course,scormid:scormid,begin:a,end:b,managerid:managerid,managername:managername});
          }
          MM.log('checkboxes:'+$(this).attr('genre')+'/'+$(this).attr('content')+'/'+$(this).is(':checked')  );
        });
        $('button#pif[user="'+userpif.userid+'"]').attr('pif',JSON.stringify(pifs3));
                            
        //MM.log('pifs length:'+pifs2.length)
        //MM.log('pif:'+pifs2[0]+'/'+pifs2[0].scormid);
        
        
        var options = {
            title: '',
            buttons: {}
        };
        
        options.buttons["Fermer"] = function() {
            MM.widgets.dialogClose();
            MM.log("Dialog:"+userpif.userid);
            $('button#pif[user="'+userpif.userid+'"]').click();
        };
        
                        
        if (valider == 1 && (avenantsignature1 == 0 || avenantsignature2 == 0)) {
            MM.popMessage("Veuillez signer au bas du tableau, pour valider les compétences à développer dans le cadre du parcours de formation.",options);
            valider = 0;
        }
        
        if (valider == 1){
                    $('button#pif[user="'+userpif.userid+'"]').attr('pif','');
                    MM.log('Save:'+pifs2+','+pifs2.length);
                    thisuser.save({pif:pifs2});
                    version = parseInt(version) + 1;
                    $('button#pif[user="'+userpif.userid+'"]').attr('version',version);

        }
        
        
    }
    //MM.Router.navigate("eleves/" + course );
    if (valider == 1) {
        MM.log("Save PIF");
        MM.widgets.dialogClose();
        $('button#pif[user="'+userpif.userid+'"]').click();
    }
    
}

function closeDialog(course,user) {
    MM.Router.navigate("eleves/" + course );
    MM.widgets.dialogClose();
}