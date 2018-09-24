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
                    var selected = [];
                    var clickedP=0;
                    var showCourseL = 0;
                    var stopCourseL = 0;
                    var showSessionL = 0;
                    var stopSessionL = 1;
                    var offlineC = 0;
                    var synchroR = 0;
                    
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
                    
                    MM.log('Number Of Users:'+users.length);
                    
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
                            if (MM.deviceConnected() && versionArray[index]>2) {
                                    var downloadAM = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+user.id+'_2_signature_manager.png');
                                    var uploadAM = MM.config.current_site.id+"/"+courseId+"/"+user.id+"_2_signature_manager.png";
                                    var downloadAS = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+user.id+'_2_signature_stagiaire.png');
                                    var uploadAS = MM.config.current_site.id+"/"+courseId+"/"+user.id+"_2_signature_stagiaire.png";
                                    var max = versionArray[index] - 1;
                                    downloadAvenantsManager(downloadAM,uploadAM,2,max,courseId,user.id);
                                    downloadAvenantsStagiaire(downloadAS,uploadAS,2,max,courseId,user.id);
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
                                        
                                        
                                        var checkedUser = MM.db.get('users', MM.config.current_site.id + "-" + user);
                                        var checkedUserJ = checkedUser.toJSON();
                                        if (checkedUserJ.pif == "" || checkedUserJ.pif == "[]") {
                                            MM.log("TEST:"+user);
                                            $('input#eleveP' + user).prop('checked',false);
                                            clickedP = 1;
                                            $("a[eleve='eleveP"+user+"']").trigger("click");
                                            
                                        } else {
                                            var objectWithEvents = $("ul#listeparticipants1 li[eleve='"+$(this).attr('id')+"']").detach();
                                            $('ul#listeparticipants2').append(objectWithEvents);
                                        }
                        
                                        
                                    }
                                    //$(this).attr("disabled", true );
                                });
                            });
                            
                            
                            $('#showSessionL').hide();
                            $('#showTimer').show();
                            //$('#offlineC').show();
                            $('#offlineC').css('visibility','visible');
                            $('#showCourseL').hide();
                            $('#stopCourseL').hide();
                            $('#createdPif').hide();
                            $('#stopSessionL').show();      
                            $('#synchroR').hide();
                            $('#showSessionL').attr('users',users);
                            $('#showCourseL').attr('users',users);
                            $('#stopCourseL').attr('users',users);
                            $('#stopSessionL').attr('users',users);
                            $('#stopSessionL').attr('starttime',obj.starttime);
                            
                            var timernow = new Date();
                            var now = timernow.getTime();
                            upTime(obj.starttime,now);
                            
                            sessioncurrent = 1;
                            
                            
                        },
                        function (result) {
                            MM.log('Load Session : NOK' + result);
                            if ($('#offlineC option').length>1) {    
                                $('input:checked').each(function() {
                                    $('#showSessionL').show();
                                    $('#showTimer').hide();
                                    clearTimeout(upTime.to);
                                });
                            }
                            
                            //$('#offlineC').hide();
                            $('#offlineC').css('visibility','hidden');
                            $('#showCourseL').hide();
                            $('#stopCourseL').hide();
                            $('#createdPif').hide();
                            $('#stopSessionL').hide();      
                            $('#synchroR').hide();
                            $('#showTimer').hide();
                            clearTimeout(upTime.to);
                        }
                    );
                    
                    
                    
                    var directoryResult = MM.config.current_site.id + "/" + courseId + "/result/";
                    MM.fs.getDirectoryContents(directoryResult,
                        function(entries) {

                            if(entries.length > 0) {
                                
                                var checkmoduleopened = 0;
                                
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
                                                     $('#showTimer').show();
                                                     //$('#offlineC').hide();
                                                     $('#offlineC').css('visibility','hidden');
                                                     $('#showCourseL').hide();
                                                     $('#createdPif').hide();
                                                     $('#stopCourseL').show();
                                                     $('#stopSessionL').hide();
                                                     $("#stopCourseL").attr("module",namefile[0]);
                                                     checkmoduleopened = 1
                                                } else {
                                                     if (!checkmoduleopened) {
                                                        $('#stopSessionL').show();
                                                     }
                                                     
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
                    
                    
                    
                    

                    
                        
                    // Save the users in the users table.
                    var newUser;
                    $.each(users, function( index, user ) {
                    MM.log('Index Of Users:'+index);
                    //users.forEach(function(index,user) {
                        newUser = {
                            'id': MM.config.current_site.id + '-' + user.id,
                            'userid': user.id,
                            'fullname': user.fullname,
                            'profileimageurl': user.profileimageurl,
                            'lastname': user.lastname,
                            'firstname': user.firstname,
                            'email': user.email,
                            'notes':user.notes
                            //'grille':user.grille
                        };
                        var checkUser = MM.db.get('users', MM.config.current_site.id + "-" + user.id);
                        if (checkUser && !MM.deviceConnected()) {
                            //Cas ou on recupere pas les infos serveurs
                            
                            var checkUserJ = checkUser.toJSON();
                            newUser.pif = checkUserJ.pif;
                            newUser.grille = checkUserJ.grille;
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
                            
                            
                            //Recup des grilles
                            var newgrille = user.grille;
                            MM.log('Recup des grilles:'+user.id+'/'+checkUserJ.grille+'/'+newgrille);
                            MM.log('Recup des grilles:'+user.id+'/'+checkUserJ.grille.q1+'/'+newgrille.q1);
                            if (checkUserJ.grille == "" || checkUserJ.grille == "[]" || checkUserJ.grille == undefined) {
                                newUser.grille = newgrille;
                                MM.log('No Local Grille');
                            } else {
                                MM.log('Local Grille');
                                if (newgrille == "" || newgrille == "[]" || newgrille == undefined) {
                                    newUser.grille = checkUserJ.grille;
                                    MM.log('No Online Grille');
                                } else {
                                    if (newgrille.q1 > checkUserJ.grille.q1 || newgrille.q2 > checkUserJ.grille.q2 || newgrille.q3 > checkUserJ.grille.q3 || newgrille.q4 > checkUserJ.grille.q4 || newgrille.q5 > checkUserJ.grille.q5 || newgrille.q6 > checkUserJ.grille.q6){
                                        newUser.grille = newgrille;
                                         MM.log('Online Grille More Recent');
                                    } else {
                                        newUser.grille = checkUserJ.grille;
                                        MM.log('Offline Grille More Recent');
                                    }
                                }
                            }
                            
                            
                        }
                        if (!checkUser) {
                            newUser.pif = user.pif;
                            newUser.grille = user.grille;
                        }
                        
                        MM.log('GRILLE:'+newUser.grille);
                        //var newuserpif = newUser.toJSON();
                        
                        
                        
                        var pifusercoursewithsignature1 = $.grep(newUser.pif, function( el ) {
                                        return el.courseid == courseId && el.signature_avant_manager == 1;
                        });
                        
                        if (pifusercoursewithsignature1[0]) {
                            MM.log('Signature Pif 1 pour User:'+user.id+' et cours:'+courseId+' Existe');
                            var downloadUrl1 = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+user.id+'_signature_manager_avant.png');
                            var uploadFile1 = MM.config.current_site.id+"/"+courseId+"/"+user.id+"_signature_manager_avant.png";
                            MM.log('File1:'+uploadFile1+'////'+downloadUrl1);
                            /*
                            MM.fs.fileExists(uploadFile1,
                                function(fullpath) {
                                    MM.log(uploadFile1+' Présent');
                                },
                                function(fullpath) {
                            */
                            //if (MM.deviceConnected()) {
                                
                                    MM.fs.fileExists(uploadFile1,
                                            function(path) {
                                                MM.log(uploadFile1+' Présent');
                                    
                                            },
                                            function(path) {
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
                                    );
                                    
                            //}
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
                            MM.log('File2:'+uploadFile2+'////'+downloadUrl2);
                            /*
                            MM.fs.fileExists(uploadFile2,
                                function(fullpath) {
                                    MM.log(uploadFile2+' Présent');
                                },
                                function(fullpath) {
                            */
                            //if (MM.deviceConnected()) {
                                    MM.fs.fileExists(uploadFile2,
                                            function(path) {
                                                MM.log(uploadFile2+'Présent');
                                            },
                                            function(path) {
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
                                    );
                                            
                                    
                            //}
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
                            MM.log('File3:'+uploadFile3+'////'+downloadUrl3);
                            /*
                            MM.fs.fileExists(uploadFile3,
                                function(fullpath) {
                                    MM.log(uploadFile3+' Présent');
                                },
                                function(fullpath) {
                            */
                            //if (MM.deviceConnected()) {
                                    MM.fs.fileExists(uploadFile3,
                                            function(path) {
                                                MM.log(uploadFile3+'Présent');
                                            },
                                            function(path) {
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
                                    );
                            //}
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
                            MM.log('File4:'+uploadFile4+'////'+downloadUrl4);
                            /*
                            MM.fs.fileExists(uploadFile4,
                                function(fullpath) {
                                    MM.log(uploadFile4+' Présent');
                                },
                                function(fullpath) {
                            */
                            //if (MM.deviceConnected()) {
                                    MM.fs.fileExists(uploadFile4,
                                            function(path) {
                                                MM.log(uploadFile4+'Présent');
                                            },
                                            function(path) {
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
                                    );
                            //}
                            /*
                                }
                            );
                            */
                        }
                        
                        
                        
                            
                        MM.db.insert('users', newUser);
                        
                        
                        
                        
                        
                        
                    });
                    
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
                    
                    MM.updateGrille();

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
                        
                       MM.popMessage(messagestart, {title:'Synchronisation des résultats', autoclose: 0, resizable: false});
                            
                        //Get Pifs
                        var pifscourse = new Array();
                        var grillecourse = new Array();
                        var pifsusers = "";
                        var userspif = MM.db.where("users",{site: MM.config.current_site.id});
                        var indexuser = 0;
                        var countuser = userspif.length;
                        var uploaduser = 0;
                        
                        MM.log("USER:"+countuser);
                        
                        $.each(userspif, function( indexUsers, userpif ) {
                            var jsonpif = userpif.toJSON();
                            var pifs = jsonpif.pif;
                            var grille = jsonpif.grille;
                            grillecourse[indexUsers] = grille;
                            
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
                            MM.log('Bilan User:'+indexuser+'/'+countuser+'/'+uploaduser);
                            
                            
                            MM.fs.findFileAndReadContents(filePifSignatures,
                                function (result) {
                                    //indexuser++;
                                    MM.log('filePifSignatures : ' + filePifSignatures);
                                    pifSignatureArray = JSON.parse(result);
                                    var countPifSig = pifSignatureArray.length;
                                    var indexPifSig = 0;
                                    var uploadPif = 0;
                                    
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
                                        //indexPifSig = indexPifSig + 1;
                                        MM.log('Bilan PIF:'+indexPifSig+'/'+countPifSig+'/'+uploadPif)
                                                              
                                        MM.fs.fileExists(valuePif,
                                            function(path) {
                                                MM.log('filePif : ' + valuePif);
                                                var ft = new FileTransfer();
                                                    ft.upload(
                                                            path,
                                                            MM.config.current_site.siteurl + '/local/session/uploadsignaturepif.php',
                                                            function(r){
                                                                MM.log('Upload Pif réussi:'+path);
                                                                MM.log("Code = " + r.responseCode);
                                                                MM.log("Response = " + r.response);
                                                                MM.log("Sent = " + r.bytesSent);
                                                                if (r.responseCode != 200 || r.byteSent==0) {
                                                                    uploadPif = 1;
                                                                }
                                                                indexPifSig++;
                                                                if (indexPifSig == countPifSig) {
                                                                    indexuser++;
                                                                    if (!uploadPif) {
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
                                                                
                                                                if (indexuser == countuser) {
                                                                    if (!uploaduser) {
                                                                        //MM.log('UPLOADAVENANT');
                                                                        uploadAvenant(userspif,on,course);
                                                                    } else {
                                                                        MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 5000, resizable: false});
                                                                    }
                                                                }
                                                            },
                                                            function(error){
                                                                MM.log('Pas Upload Pif réussi:'+path);
                                                                MM.log("An error has occurred: Code = " + error.code);
                                                                MM.log("upload error source " + error.source);
                                                                MM.log("upload error target " + error.target);
                                                                indexPifSig++;
                                                                uploadPif = 1;
                                                                uploaduser = 1;
                                                               
                                                                if (indexPifSig == countPifSig) {
                                                                    indexuser++;
                                                                }
                                                                
                                                                if (indexuser == countuser) {
                                                                    if (!uploaduser) {
                                                                        //MM.log('UPLOADAVENANT');
                                                                        uploadAvenant(userspif,on,course);
                                                                    } else {
                                                                        MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 5000, resizable: false});
                                                                    }
                                                                }
                                                
                                                            },
                                                            options2
                                                  );
                                            },
                                            function (path) {
                                                MM.log('Pas de filePif : ' + valuePif);
                                                indexPifSig++;
                                                
                                                if (indexPifSig == countPifSig) {
                                                    indexuser++;
                                                    if (!uploadPif) {
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
                                                
                                                if (indexuser == countuser) {
                                                    if (!uploaduser) {
                                                        //MM.log('UPLOADAVENANT');
                                                        uploadAvenant(userspif,on,course);
                                                    } else {
                                                        MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 5000, resizable: false});
                                                    }
                                                }
                                            }
                                        );
                                        
                                        
                                    });
                                },
                                function(result) {
                                    indexuser++;
                                    MM.log('Pas de filePifSignatures :'+filePifSignatures);
                                    
                                    if (indexuser == countuser) {
                                        if (!uploaduser) {
                                            //MM.log('UPLOADAVENANT');
                                            uploadAvenant(userspif,on,course);
                                        } else {
                                            MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 5000, resizable: false});
                                        }
                                    }
                                }
                            );
                            
                            
                            
                        });
                        
                        
                        
                        
                        //MM.widgets.dialogClose();
                        
                        
                    });
                    
                    //Check Button
                    MM.log("Check Button");
                    
                    
                    $('a#lielevelP').on('click touchstart', function(e) {
                        e.preventDefault(); 
                        selected = [];
                        var checkbox = $('#' + $(this).attr('eleve'));
                        
                        MM.log('label clicked:'+$(this).attr('eleve')+"/"+checkbox.val());
                        
                        if(checkbox.is(':checked')) {
                              checkbox.prop('checked',false);
                              var theuser = MM.db.where('users', {'userid':parseInt(checkbox.val()), 'site':MM.config.current_site.id});
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
                            var isNotCreated = 0;
                            var usersSelected = "";
                            $.each(selected, function(indexSelected, valueSelected) {
                                usersSelected += valueSelected+",";
                                
                                var getuserselected = MM.db.get('users',MM.config.current_site.id + "-" + parseInt(valueSelected));
                                var getuserselectedG = getuserselected.toJSON();
                                //MM.log('getuserselectedG:'+usersSelected + '/' + getuserselectedG.pif);
                                
                                if (getuserselectedG.pif == "" || getuserselectedG.pif == "[]") {
                                    isNotCreated = 1;
                                }
                            });
                            
                            var lenghtSelected = usersSelected.length - 1;
                            
                            
                            
                            
                            
                            if ($('#offlineC option').length>1) {
                                $("#showSessionL").attr("users",usersSelected.substr(0, lenghtSelected) );
                                $("#stopSessionL").attr("users",usersSelected.substr(0, lenghtSelected) );
                                $("#showCourseL").attr("users",usersSelected.substr(0, lenghtSelected) );
                                $("#stopCourseL").attr("users",usersSelected.substr(0, lenghtSelected) );
                                //$("#showSessionL").show();
                                
                                /*
                                if (isNotCreated) {
                                            if (!clickedP) {
                                                if ($('#showCourseL').is(':visible'))
                                                    showCourseL = 1;
                                                else
                                                    showCourseL = 0;
                                                if ($('#stopCourseL').is(':visible'))
                                                    stopCourseL = 1;
                                                else
                                                    stopCourseL = 0;
                                                if ($('#showSessionL').is(':visible'))
                                                    showSessionL = 1;
                                                else
                                                    showSessionL = 0;
                                                if ($('#stopSessionL').is(':visible'))
                                                    stopSessionL = 1;
                                                else
                                                    stopSessionL = 0;
                                                    
                                                if ($('#offlineC').css('visibility') == 'visible')
                                                    offlineC = 1;
                                                else
                                                    offlineC = 0;
                                                if ($('#synchroR').is(':visible'))
                                                    synchroR = 1;
                                                else
                                                    synchroR = 0;
                                                    
                                                clickedP = 1;
                                                MM.log("SAVE:"+showCourseL+'/'+stopCourseL+'/'+showSessionL+'/'+stopSessionL+'/'+offlineC+'/'+synchroR);   
                                            }
                                }
                                */
                                
                                var resultFile =  MM.config.current_site.id + "/" + courseId + "/result/session.json";
                            
                                MM.fs.findFileAndReadContents(resultFile,
                                    function (result) {
                                        $("#showSessionL").hide();
                                        $("#showTimer").show();
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
                                        
                                        MM.log("CLICKEDP:"+clickedP+'/'+obj.clickedP+'/'+isNotCreated);   
                            
                                        if (isNotCreated) {
                                            if (!obj.clickedP) {
                                                if ($('#showCourseL').is(':visible'))
                                                    showCourseL = 1;
                                                else
                                                    showCourseL = 0;
                                                if ($('#stopCourseL').is(':visible'))
                                                    stopCourseL = 1;
                                                else
                                                    stopCourseL = 0;
                                                if ($('#showSessionL').is(':visible'))
                                                    showSessionL = 1;
                                                else
                                                    showSessionL = 0;
                                                if ($('#stopSessionL').is(':visible'))
                                                    stopSessionL = 1;
                                                else
                                                    stopSessionL = 1;
                                                    
                                                if ($('#offlineC').css('visibility') == 'visible')
                                                   offlineC = 1;
                                                else
                                                    offlineC = 0;
                                                if ($('#synchroR').is(':visible'))
                                                    synchroR = 1;
                                                else
                                                    synchroR = 0;
                                                    
                                                clickedP = 1;
                                                MM.log("SAVE:"+showCourseL+'/'+stopCourseL+'/'+showSessionL+'/'+stopSessionL+'/'+offlineC+'/'+synchroR);   
                                            } else {
                                                showCourseL = obj.showCourseL;
                                                stopCourseL = obj.stopCourseL;
                                                showSessionL = obj.showSessionL;
                                                stopSessionL = obj.stopSessionL;
                                                offlineC = obj.offlineC;
                                                synchroR = obj.synchroR;
                                                
                                            }
                                            
                                            
                                            
                                            $('#offlineC').css('visibility','visible');
                                            $('#offlineC').attr('disabled','disabled'); 
                                            $("#showCourseL").hide();
                                            $("#stopCourseL").hide();
                                            $("#showSessionL").hide();
                                            $("#stopSessionL").hide();
                                            $("#synchroR").hide();
                                            $('#createdPif').show();
                                            
                                        } else {
                                            
                                            /*
                                            if (!obj.clickedP) {
                                                
                                                $('#offlineC').css('visibility','visible');
                                                $('#offlineC').removeAttr('disabled');
                                                $("#showCourseL").hide();
                                                $("#stopCourseL").hide();
                                                $("#showSessionL").hide();
                                                $("#stopSessionL").hide();
                                                $("#synchroR").hide();
                                                $('#createdPif').hide();
                                                
                                            }
                                            */
                                            
                                            if (obj.clickedP) {
                                                MM.log("LOAD:"+obj.showCourseL+'/'+obj.stopCourseL+'/'+obj.showSessionL+'/'+obj.stopSessionL+'/'+obj.offlineC+'/'+obj.synchroR); 
                                               
                                               
                                               
                                               if (showCourseL) {
                                                    $('#showCourseL').show();
                                               } else {
                                                    $('#showCourseL').hide();
                                               }
                                               if (stopCourseL) {
                                                    $('#stopCourseL').show();
                                               } else {
                                                    $('#stopCourseL').hide();
                                               }
                                               if (showSessionL) {
                                                    $('#showSessionL').show();
                                               } else {
                                                    $('#showSessionL').hide();
                                               }
                                               if (stopSessionL) {
                                                    $('#stopSessionL').show();
                                               } else {
                                                    $('#stopSessionL').hide();
                                               }
                                               if (synchroR) {
                                                    $('#synchroR').show();
                                               } else {
                                                    $('#synchroR').hide();
                                               }
                                               if (offlineC) {
                                                    $('#offlineC').css('visibility','visible');
                                                    $('#offlineC').removeAttr('disabled'); 
                                               } else {
                                                    $('#offlineC').css('visibility','hidden');
                                                    $('#offlineC').removeAttr('disabled');
                                               }
                                               $('#createdPif').hide();
                                               clickedP = 0;
                                            }
                                            $('#offlineC').removeAttr('disabled');
                                        }
                                        
                                        
                                        MM.fs.createFile(resultFile,
                                            function(fileEntry) {
                                                var content = '{"clickedP":'+clickedP+',"showCourseL":'+showCourseL+',"stopCourseL":'+stopCourseL+',"showSessionL":'+showSessionL+',"stopSessionL":'+stopSessionL+',"offlineC":'+offlineC+',"synchroR":'+synchroR+',"starttime":"'+starttime+'","users":"'+usersSelected.substr(0, lenghtSelected)+'","notes":'+jsonNotes+'}';
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
                                        $("#stopSessionL").hide();
                                        $("#showTimer").hide();
                                        clearTimeout(upTime.to);
                                        $('#createdPif').hide();
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
                                        $("#showSessionL").hide();
                                        $("#stopSessionL").show();
                                },
                                function (result) {
                                    $("#showSessionL").hide();
                                    $("#stopSessionL").hide();
                                    $("#showTimer").hide();
                                }
                            );
                            
                            $("#stopSessionL").attr("users","");
                            $("#showCourseL").attr("users","");
                            $("#stopCourseL").attr("users","");
                            $('#createdPif').hide();
                            //$("#stopSessionL").show();
                            
                        }
                        
                    });
                    
                    
                    
                    var clickedP = 0;
                    
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
                        
                        usersSelected = "";
                        var isNotCreated = 0;
                        $.each(selected, function(indexSelected, valueSelected) {
                             usersSelected += valueSelected+",";
                             var getuserselected = MM.db.get('users',MM.config.current_site.id + "-" + parseInt(valueSelected));
                             var getuserselectedG = getuserselected.toJSON();
                             MM.log('USER:'+valueSelected+'/'+getuserselectedG.userid+'/'+getuserselectedG.pif)
                             if (getuserselectedG.pif == "" || getuserselectedG.pif == "[]") {
                                isNotCreated = 1;
                             }
                        });
                        lenghtSelected = usersSelected.length - 1;
                        
                        if (selectedCourse != 0) {
                           MM.log("Selected Course:"+selectedCourse);
                           if (isNotCreated) {
                                $("#showCourseL").hide();
                                $("#stopCourseL").hide();
                                $('#createdPif').show();
                                $("#stopSessionL").hide();
                           } else {
                                $("#showCourseL").show();
                                $("#stopCourseL").hide();
                                $('#createdPif').hide();
                                $("#stopSessionL").show();
                           }   
                        } else {
                            MM.log("Selected Course NOK");
                            if (isNotCreated) {
                                $("#showCourseL").hide();
                                $("#stopCourseL").hide();
                                $('#createdPif').show();
                                $("#stopSessionL").hide();
                            } else {
                                $("#showCourseL").hide();
                                $("#stopCourseL").hide();
                                $('#createdPif').hide();
                                $("#stopSessionL").show();
                            }
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
                        
                        offlineC = 1;
                        showSessionL = 0;
                        var course = $(this).attr("course");
                        
                        $('input:checkbox').each(function() {
                            MM.log("Check Button Checked:" + $(this).val());
                            //$(this).attr("disabled", true);
                        });
                        
                        $('#offlineC > option').removeAttr("selected");
                        $('#offlineC option[value="0"]').prop('selected', true);
                        
                        var users = $(this).attr('users');
                        
                        
                        var timernow = new Date();
                        var now = timernow.getTime();
                        
                        upTime(now,now);
                        
                        var isNotCreated = 0;
                        $.each(selected, function(indexSelected, valueSelected) {
                             var getuserselected = MM.db.get('users',MM.config.current_site.id + "-" + parseInt(valueSelected));
                             var getuserselectedG = getuserselected.toJSON();
                             MM.log('USER:'+valueSelected+'/'+getuserselectedG.userid+'/'+getuserselectedG.pif)
                             if (getuserselectedG.pif == "" || getuserselectedG.pif == "[]") {
                                isNotCreated = 1;
                             }
                        });
                        
                        
                        
                        var fileResultL = MM.config.current_site.id+"/"+course+"/result/session.json";
                        MM.fs.createFile(fileResultL,
                            function(fileEntry) {
                                var d = new Date();
                                if (isNotCreated) {
                                    var content = '{"clickedP":1,"showCourseL":0,"stopCourseL":0,"showSessionL":0,"stopSessionL":1,"offlineC":1,"synchroR":0,"starttime":"'+d.getTime()+'","users":"'+users+'"}';
                                } else {
                                    content = '{"starttime":"'+d.getTime()+'","users":"'+users+'"}';
                                }
                                MM.log('Create Session start :'+content);
                                MM.fs.writeInFile(fileEntry, content, 
                                    function(fileUrl) {
                                        MM.log('Write Session :'+fileUrl);
                                        $('#stopSessionL').attr('starttime',d.getTime());
                                        $('#showSessionL').hide();
                                        $('#showTimer').show();
                                        $('#synchroR').hide();
                                        //$('#offlineC').show();
                                        $('#offlineC').css('visibility','visible');
                                        if (isNotCreated) {
                                            $('#createdPif').show();
                                            $('#stopSessionL').hide();
                                        
                                            $('#offlineC').attr('disabled','disabled'); 
                                        } else {
                                            $('#createdPif').hide();
                                            $('#stopSessionL').show();
                                        
                                            $('#offlineC > option').removeAttr("selected");
                                        }
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
                        var countSignature = 0;
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
        
                        
                        if (users == "" || users == undefined) {
                            var options2 = {
                                title: '',
                                buttons: {}
                            };
                            
                            options2.buttons["Fermer"] = function() {
                                MM.widgets.dialogClose2();                                
                            };
                            
                            options2.buttons["Fermer"]["style"] = "modal-button-8";
                                            
                            MM.popMessage2("Aucun participant sélectionné. Pour fermer la session, sélectionnez au moins un participant..",options2);
                               
                        } else {
                        
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
                                                            html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td class="center2"><table style="width:100%;background:none"><tr style="background:none"><td style="border:0;text-align:right"><img src="'+ path +'" width="300"></td><td style="border:0;text-align:left"><button id="notes" course="'+course+'" user="'+valueS+'" onclick="notePopin(this)" class="btn grd-grisclair text-blanc"></button></td></tr></table></td></tr>';
                                                            if (indexUser == usersS.length) {
                                                                html += '</table></div>';
                                                                MM.log('Session Module Go:');
                                                                $("#app-dialog").removeClass('full-screen-dialog2');
                                                                MM.widgets.dialog(html, options);
                                                            	
                                                            }
                                                            countSignature++;
                                                            indexUser++;
                                                        },
                                                        function(path) {
                                                            MM.log('Image Signature NOK:'+fileSignature);
                                                            html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td class="center2"><table style="width:100%;background:none"><tr style="background:none"><td style="border:0;text-align:right"><button id="signature" course="'+course+'" name="signature" userid="'+valueS+'" time="'+timeSession+'" onclick="signaturePopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td><td style="border:0;text-align:left"><button id="notes" course="'+course+'" user="'+valueS+'" onclick="notePopin(this)" class="btn grd-grisclair text-blanc"></button></td></tr></table></td></tr>';
                                                            if (indexUser == usersS.length) {
                                                                html += '</table></div>';
                                                                MM.log('Session Module Go:');
                                                                $("#app-dialog").removeClass('full-screen-dialog2');
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
                                                var indexUser = 1;
                                                $.each(usersS, function( indexS, valueS ) {
                                                    var userP = MM.db.get('users', MM.config.current_site.id + "-" + valueS);
                                                    var userG = userP.toJSON();
                                                    var fileSignature = MM.config.current_site.id+"/"+course+"/result/"+valueS+"_"+timeSession+".png";
                                                    
                                                    MM.fs.findFileAndReadContents(fileSignature,
                                                        function(path) {
                                                            MM.log('Image Signature OK:'+fileSignature);
                                                            html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td class="center2"><table style="width:100%;background:none"><tr style="background:none"><td style="border:0;text-align:right"><img src="'+ path +'" width="300"></td><td style="border:0;text-align:left"><button id="notes" course="'+course+'" user="'+valueS+'" onclick="notePopin(this)" class="btn grd-grisclair text-blanc"></button></td></tr></table></td></tr>';
                                                            if (indexUser == usersS.length) {
                                                                html += '</table></div>';
                                                                MM.log('Session Module Go:');
                                                                $("#app-dialog").removeClass('full-screen-dialog2');
                                                                MM.widgets.dialog(html, options);
                                                            	
                                                            }
                                                            countSignature++;
                                                            indexUser++;
                                                        },
                                                        function(path) {
                                                            MM.log('Image Signature NOK:'+fileSignature);
                                                            html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td class="center2"><table style="width:100%;background:none"><tr style="background:none"><td style="border:0;text-align:right"><button id="signature" course="'+course+'" name="signature" userid="'+valueS+'" time="'+timeSession+'" onclick="signaturePopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td><td style="border:0;text-align:left"><button id="notes" course="'+course+'" user="'+valueS+'" onclick="notePopin(this)" class="btn grd-grisclair text-blanc"></button></td></tr></table></td></tr>';
                                                            if (indexUser == usersS.length) {
                                                                html += '</table></div>';
                                                                MM.log('Session Module Go:');
                                                                $("#app-dialog").removeClass('full-screen-dialog2');
                                                                MM.widgets.dialog(html, options);
                                                             	
                                                            }
                                                            indexUser++;
                                                        }
                                                    );
                                                    
                                                    //html += '<tr><td>'+userG.fullname+'</td><td>'+modules+'</td><td><button id="signature" name="signature" userid="'+userG.userid+'" course="'+course+'" time="'+timeSession+'" modules="'+modulesId+'" onclick="signaturePopin(this)" class="btn grd-vert text-blanc">Signature</button></td></tr>';
                                                });
                                                /*
                                                html += '</table></div>';
                                                MM.log('Session Module Go:'+html);
                                                $("#app-dialog").removeClass('full-screen-dialog2');
                                                MM.widgets.dialog(html, options);
                                                */
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
                                    $('#showTimer').hide();
                                    clearTimeout(upTime.to);
                                    //$('#offlineC').hide();
                                    $('#offlineC').css('visibility','hidden');
                                    $('#showCourseL').hide();
                                    $('#stopCourseL').hide();
                                    $('#createdPif').hide();
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
                                
                                console.log('COUNT:'+countSignature+'/'+usersS.length);
                                
                                if (countSignature<usersS.length) {
                                    MM.popConfirm2("Tous les participants doivent signer", function() {
                                        MM.widgets.dialogClose();
                                        MM.Router.navigate("eleves/" + course);
                                        $("#stopSessionL").click();
                                    });
                                } else {
                                    
                                
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
                                                            $('#showTimer').hide();
                                                            clearTimeout(upTime.to);
                                                            //$('#offlineC').hide();
                                                            $('#offlineC').css('visibility','hidden');
                                                            $('#showCourseL').hide();
                                                            $('#stopCourseL').hide();
                                                            $('#createdPif').hide();
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
                                }
                            };
                            options.buttons[addNote]['style'] = "modal-button-2";
                        
                        }
            
                        
                    
                    });
                    
                    
                    //Pif button
                    $('button#pif').on(MM.clickType, function(e) {
                        
                        MM.log('Pif clicked');
                        var button = $(this);
                        var course = $(this).attr("course");
                        var user = $(this).attr("user");
                        var version = $(this).attr("version");
                        var pifs = $(this).attr("pif");
                        var theuser = MM.db.get("users", MM.config.current_site.id + "-" + parseInt(user));
                        modif = 0;
                        if (pifs != "") {
                            modif = 1;
                        }
                        clickPif(button,course,user,version,pifs);
                        
                        //MM.log('pif:'+course+'/'+user);
                        
                        /*
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
                        if (version == 1)
                            html += '<p align="center"><button onclick="modifierPif(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"  version="'+version+'" class="modal-button-6" style="width: 25%">Modifier le PIF</button></p>';
                        if (version == 2)
                            html += '<p align="center"><button onclick="voirpif(\''+course+'\',\''+user+'\',\''+version+'\')" course="'+course+'" user="'+user+'" version="'+version+'" class="modal-button-5" style="width: 25%">Voir le PIF</button><button onclick="modifierPif(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"  version="'+version+'" class="modal-button-6" style="width: 25%">Modifier le PIF</button></p>';
                        if (version > 2)
                            html += '<p align="center"><button onclick="voirlespif(\''+course+'\',\''+user+'\')" course="'+course+'" user="'+user+'" version="'+version+'" class="modal-button-5" style="width: 25%">Voir le PIF</button><button onclick="modifierPif(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"  version="'+version+'" class="modal-button-6" style="width: 25%">Modifier le PIF</button></p>';
                        html += '<br/><br/><br/><p align="center">Une fois l\'ensemble du parcours de formation finalisée, vous pourrez compléter la grille<br/> de positionnement ci-dessous en aval de la formation.</p>';
                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
                        html += '<tr><td><span class="pifgris">GRILLE DE POSITIONNEMENT</span> <span class="pifnoir">AMONT :</span></td><td> <button class="modal-button-1">Voir</button></td></tr>';
                        html += '<tr><td><span class="pifgris">GRILLE DE POSITIONNEMENT</span> <span class="pifnoir">AVAL :</span></td><td> <button style="width:200px" class="modal-button-5">Compléter</button></td></tr>';
                        html += '</table>';
                        
                        var options = {
                            title: 'Stagiaire '+userpif.fullname+'<div class="closedialog"><a href="javascript:void(0)" onclick="closeDialog('+course+','+user+')">X</a></div>',
                            width: "98%",
                            marginTop: "5%",
                            buttons: {}
                        };
                        
                        options.buttons["Fermer"] = function() {
                            //MM.Router.navigate("eleves/" + course );
                            closeDialog(course,user);
                        };
                        
                        $("#app-dialog").addClass('full-screen-dialog2');
                        $("#app-dialog .modalContent").css('height','85vh');
                        MM.widgets.dialog(html, options);
                        
                        if (pifArray != "") {
                            $("button#modifierpif").click();
                            
                        }
                        
                        */
                        
                    });
                    
                    
                    
                    
                    
                    
                    //Creer Pif button
                    $('button#creerpif').on(MM.clickType, function(e) {
                        MM.log('Creer Pif clicked');
                        var button = $(this);
                        var course = $(this).attr("course");
                        var user = $(this).attr("user");
                        var version = $(this).attr("version");
                        var theuser = MM.db.get('users',MM.config.current_site.id + "-" + parseInt(user));
                        var userG = theuser.toJSON();
                        var grille = userG.grille;
                        
                        var sessionFile =  MM.config.current_site.id + "/" + course + "/result/session.json";
                        var isCreate = 0;
                       
                        MM.fs.findFileAndReadContents(sessionFile,
                            function (result) {
                                if ($('#eleveP'+user).prop("checked") == true) {
                                    
                                    if (grille != "" && grille != "[]" && (grille.q1 == 2 || grille.q2 == 2 || grille.q3 == 2)) {
                                        clickPif(button,course,user,version,'');
                                    } else {
                                        isCreate = 1;
                                        var html = '<div id="pifContent"><br/><br/>';
                                        html += '<h1 align="center"><strong>À L\'ATTENTION DU MANAGER</strong></h1><br/><br/><br/><br/>';
                                        html += '<p align="center">Pour commencer le parcours de formation de ce stagiaire veuillez remplir la grille de positionnement ci-dessous.<br/>Cette grille vous permettra d\'évaluer les compétences que le stagiaire devra développer dans le cadre de sa formation</p><br/><br/><br/><br/>';
                                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
                                        html += '<tr><td style="text-align:center"><button onclick="amont(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="amont" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:50%;height:50px" class="modal-button-5">Grille de Positionnement<br>(AMONT)</button><p><i>Aucune grille de positionnement amont validée</i></p></td></tr>';
                                        html += '</table>';
                                        html += '</div>';
                                        
                                        var options = {
                                            title: 'Stagiaire '+userG.fullname+'<div class="closedialog"><a href="javascript:void(0)" onclick="closeDialog('+course+','+user+')">X</a></div>',
                                            width: "98%",
                                            marginTop: "5%",
                                            buttons: {}
                                        };
                                        
                                        options.buttons["Fermer"] = function() {
                                            //MM.Router.navigate("eleves/" + course );
                                            closeDialog(course,user);
                                        };
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
					document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                    }
                                    
                                } else {
                                    var options= {
                                        title: '',
                                        buttons: {}
                                    };
                                    options.buttons["Fermer"] = function() {
                                        MM.widgets.dialogClose2();
                                    };
                                    var html = "Pour créer le PIF de ce stagiaire, veuillez vous assurer qu'il fait bien parti des participants sélectionnés, puis cliquez sur 'Démarrer la session'";
                                    MM.widgets.dialog2(html, options);
                                    document.getElementById("pifContent").style.height = ((window.innerHeight * 70)/100) + "px";
                                }
                            },
                            function (result) {
                                    var options= {
                                        title: '',
                                        buttons: {}
                                    };
                                    options.buttons["Fermer"] = function() {
                                        MM.widgets.dialogClose2();
                                    };
                                    var html = "Pour créer le PIF de ce stagiaire, veuillez vous assurer qu'il fait bien parti des participants sélectionnés, puis cliquez sur 'Démarrer la session'";
                                    MM.widgets.dialog2(html, options);
                            }
                        );
                        
                        
                    });
                    
                
                    
                    
                    //Notes button
                    
                    $('button#notes').on(MM.clickType, function(e) {
                        MM.log('notes clicked');
                        var button=$(this);
                        //e.preventDefault();
                        var course = $(this).attr("course");
                        var user = $(this).attr("user");
			var theuser = MM.db.get("users", MM.config.current_site.id + "-" + parseInt(user));
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
                                                $('#createdPif').hide();
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
    
    var usersnotes = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var usernotes = usersnotes[0].toJSON();
    var notes = usernotes.notes;
    notescourse = $.grep(notes, function( el ) {
                    return el.courseid == course;
    });
    MM.log('notescourse length:'+notescourse.length);
    
    var thisuser = MM.db.get("users", MM.config.current_site.id + "-" + parseInt(usernotes.id));
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
        width: "98%",
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
                width: "98%",
                marginTop: "5%",
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
    var theuser = MM.db.get("users", MM.config.current_site.id + "-" + parseInt(user));
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
    var usersnotes = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
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
        $('input[name="a_'+content+'"]').prop('disabled', true);
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
        var grille = userspif.grille;
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
        
        if (userpif.pif == "" || userpif.pif == "[]")
            $('button#creerpif[user="'+userpif.userid+'"]').attr('pif',pifbutton);
        else
            $('button#pif[user="'+userpif.userid+'"]').attr('pif',pifbutton);
        //MM.log('pifs length:'+pifs2.length)
        //MM.log('pif:'+pifs2[0]+'/'+pifs2[0].scormid);
        //$('button#modifierpif[user="'+userpif.userid+'"]').attr('pif',pifbutton);
        
        var options = {
            title: '',
            buttons: {}
        };
        
        options.buttons["Fermer"] = function() {
            MM.widgets.dialogClose2();
            MM.log("Dialog:"+userpif.userid);
            window.setTimeout(function() {
                    var elem = document.getElementById('pifContent');
                    elem.scrollTop = elem.scrollHeight;
            }, 100);
            
        };
        
        options.buttons["Fermer"]["style"] = "modal-button-8";
                        
        if (valider == 1 && avant == 1 && (pifsignature1 == 0 || pifsignature2 == 0)) {
            //$("#app-dialog").removeClass('full-screen-dialog2');
            MM.popMessage2("Veuillez signer au bas du tableau, pour valider les compétences à développer dans le cadre du parcours de formation.",options);
            valider = 0;
        }
        
        if (grille == "" || grille == "[]") {
            if (valider == 1 && apres == 1 && (pifsignature3 == 0 || pifsignature4 == 0)) {
                //$("#app-dialog").removeClass('full-screen-dialog2');
                MM.popMessage2("Veuillez signer au bas du tableau, pour valider les compétences acquises à l'issue du parcours de formation.",options);
                valider = 0;
            }
        }
        
        if (valider == 1){
            
                    MM.log("Save PIF1:"+pifs2);
                    thisuser.save({pif:pifs2});
                    
                    if (userpif.pif == "" || userpif.pif == "[]") {
                        $('button#creerpif[user="'+userpif.userid+'"]').replaceWith('<button onclick="clickPif($(this),$(this).attr(\'course\'),$(this).attr(\'user\'),$(this).attr(\'version\'),$(this).attr(\'pif\'))" class="btn grd-grisfonce text-blanc" id="pif" pif="" course="'+course+'" version="1" user="'+userpif.userid+'" path="" module="" class="btn grd-grisfonce text-rouge">PIF</button>');
                        $('input#eleveP' + userpif.userid).prop('checked',false);
                        clickedP = 1;
                        $("a[eleve='eleveP"+userpif.userid+"']").trigger("click");
                    }
                    $('button#pif[user="'+userpif.userid+'"]').attr('pif','');
                    //$('button#pif[user="'+userpif.userid+'"]').attr('pif',pifbutton);
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

function voirlespif(courseId,user) {

    var userspif = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var userpif = userspif[0].toJSON();
    var pifs = userpif.pif;
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == courseId;
    });
    
    var version = 0;
    var link = new Array();
    var newpif = 0;

    $.each(pifscourse, function( index, pif ) {
        if (pif.version > version ) {
            MM.log("Version:"+pif.date_version);
            newpif = parseInt(pif.version) + 1;
            var dateversion = new Date(parseInt(pif.date_version)*1000);
            var newdate = ("0" + dateversion.getDate()).slice(-2)+"/"+("0" + (dateversion.getMonth() + 1)).slice(-2)+"/"+dateversion.getFullYear()+" à "+("0" + (dateversion.getHours())).slice(-2)+":"+("0" + (dateversion.getMinutes() + 1)).slice(-2);
            if (pif.version == 1 ) {
                link.push('<p align="center"><a href="javascript:void(0)" onclick="voirpif(\''+courseId+'\',\''+user+'\',\''+newpif+'\')">Voir le PIF initial en date du '+newdate+'</a></p>');
            } else {
                link.push('<p align="center"><a href="javascript:void(0)" onclick="voirpif(\''+courseId+'\',\''+user+'\',\''+newpif+'\')">Voir le PIF et Avenant du '+newdate+'</a></p>');
            }
            version=pif.version;
        }
    });
    //link.push('<p align="center"><a href="javascript:void(0)" onclick="voirpif(\''+courseId+'\',\''+user+'\',\''+newpif+'\')">Voir le PIF</a></p>');
                        
    var html = '<div id="pifContent"><br/><br/>';
    
    for (var i = link.length;i--;i>=0) {
        MM.log("i:"+i);
        html+=link[i];
    }
    html+='</div>';
    
    var options = {
        title: 'Stagiaire '+userpif.fullname,
        width: "98%",
        marginTop: "20%",
        buttons: {}
    };
    
    options.buttons["Fermer"] = function() {
        //MM.Router.navigate("eleves/" + course );
        MM.widgets.dialogClose();
        $('button#pif[user="'+userpif.userid+'"]').click();
    };
    
    $("#app-dialog .modalContent").css('height','100%');
    $("#app-dialog").removeClass('full-screen-dialog2');
    MM.widgets.dialog(html, options);
    
}

function voirpif(courseId,user,version) {
    
    MM.log('Voir le pif:'+courseId);
    version = parseInt(version) - 1;
    var a;
    var b;
    var scormid;
    var pifbutton = new Array();
    var coursespif = MM.db.where("courses",{courseid : parseInt(courseId), siteid: MM.config.current_site.id});
    var coursepif = coursespif[0].toJSON();
    var pif = coursepif.pif;
    var userspif = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var userpif = userspif[0].toJSON();
    var pifs = userpif.pif;
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == courseId && el.version == version;
    });
    MM.log('pifscourse:'+pifscourse.length+'/'+pifscourse[0]);
    var managerid = pifscourse[0].managerid;
    var managername = pifscourse[0].managername;
    
    var htmlpif = '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center"><b>A remplir avant la formation</b></th><th>&nbsp;</th><th>&nbsp;</th><th class="center"><b>A remplir à l\'issue du parcours de formation</b></th></tr><tr><td class="center2"><b>Compétences à développer dans le cadre du parcours de formation</b></td><td class="center2"><b>Objectifs pédagogiques poursuivis</b></td><td class="center2"><b>Intitulés des séquences pédagogiques</b></td><td class="center2"><b>Compétences acquises à l\'issue du parcours de formation</b></td></tr>';
    var htmlpif2 = '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center"><b>Intitulés des séquences pédagogiques</b></th><th class="center"><b>Objectifs pédagogiques poursuivis</b></th><th class="center"><b>Modalités pédagogiques du module de formation</b></th><th class="center"><b>Durée estimative forfaitaire</b></th></tr>';
    
    var total_duration = 0;
    
    var local_contents = MM.db.where("contents",{courseid : courseId, site: MM.config.current_site.id});
    local_contents.forEach(function(local_content) {
        var content = local_content.toJSON();
        var unchecked = 0;
        if (content.modname == "scorm") {
            htmlpif += '<tr><td style="height:40px" class="center2">';
           
            pifscormb = $.grep(pifscourse, function( el ) {
                return el.scormid == content.contentid && el.begin == 1;
            });
            
            if (pifscormb.length>0) {
                htmlpif+='X';
                total_duration += content.pif_duration;
            } else {
                unchecked = 1;
                htmlpif+='';
            }
            htmlpif +='</td><td  class="center3">'+content.pif_pedagogicalobjectives+'</td><td class="center2">'+content.pif_fullname+'</td><td class="center2">';
             
            pifscorme = $.grep(pifscourse, function( el ) {
                    return el.scormid == content.contentid && el.end == 1;
            });
            if (pifscorme.length>0) {
                htmlpif += 'X';
            }
            if (unchecked) {
                //htmlpif+=' disabled="true"';
            }
            htmlpif +='</td></tr>';
            if (pifscormb.length>0){
                htmlpif2 +='</td><td  class="center2">'+content.pif_fullname+'</td><td class="center3">'+content.pif_pedagogicalobjectives+'</td><td class="center3">'+content.pif_pedagogicalprocedures+'</td><td class="center2">'+(content.pif_duration/60/60)+' heure(s)</td></tr>';
           
            }
        }
    });
    
    htmlpif +='</table>';
    htmlpif2 +='</table>';
    
    
    if (version == 1) {
        pif = pif.replace(new RegExp('{AVENANT}', 'gi'),'');
    } else {
            var avenant = '<h2><strong>Avenant</strong></h2>';
            avenant += '<p>Je certifie vouloir apporter ces dernières modifications à l\'article 3 du Protocole Individuel de Formation (PIF) bipartite et le stagiaire bénéficiaire en a bien pris connaissance.</p>';
            avenant += '<p>Modifié le {DATE}</p>';
            avenant += '<table style="width: 509px; height: 30px;" border="0"><tbody><tr><td>Le stagiaire bénéficiaire</td><td>Le représentant de l\'employeur</td></tr><tr><td>{SIGNATURE_APRES_PARTICIPANT}</td><td>{SIGNATURE_APRES_MANAGER}</td></tr></tbody></table>';
            pif = pif.replace(new RegExp('{AVENANT}', 'gi'),avenant);
    }
    
    pif = pif.replace(new RegExp('{COMPANY_MANAGER}', 'gi'),managername);
    pif = pif.replace(new RegExp('{USER_LAST_NAME}', 'gi'),userpif.lastname);
    pif = pif.replace(new RegExp('{USER_FIRST_NAME}', 'gi'),userpif.firstname);
    pif = pif.replace(new RegExp('{USER_EMAIL}', 'gi'),userpif.email);
    pif = pif.replace(new RegExp('{PAGE_BREAK}', 'gi'),'');
    pif = pif.replace(new RegExp('{COMPANY_NUMBER}', 'gi'),coursepif.company_number);
    pif = pif.replace(new RegExp('{COMPANY_ADDRESS}', 'gi'),coursepif.company_address);
    pif = pif.replace(new RegExp('{COMPANY_POSTAL_CODE}', 'gi'),coursepif.company_cp);
    pif = pif.replace(new RegExp('{COMPANY_CITY}', 'gi'),coursepif.company_city);
    
    if (version == 1) {
        var aujourdhui = new Date();
    } else {
        MM.log('DATE VERSION:' + pifscourse[0].date_version);
        aujourdhui = new Date(parseInt(pifscourse[0].date_version)*1000);
    }
    
    aujourdhui = new Date(parseInt(pifscourse[0].date_version)*1000);
    
    //var aujourdhui = new Date();
    //var date = aujourdhui.getDate()+'/'+(aujourdhui.getMonth()+1)+'/'+aujourdhui.getFullYear();
    var date = ("0" + aujourdhui.getDate()).slice(-2)+"/"+("0" + (aujourdhui.getMonth() + 1)).slice(-2)+"/"+aujourdhui.getFullYear();

    pif = pif.replace(new RegExp('{DATE}', 'gi'),date);
    
    MM.log("user/licenses:"+parseInt(user)+'/'+coursepif.licenses)
    var license = $.grep(coursepif.licenses, function( el ) {
        return el.userid == parseInt(user);
    });
    MM.log("license:"+license + 'start:' + license[0].start);
    var start = new Date(parseInt(license[0].start)*1000);
    var end = new Date(parseInt(license[0].end)*1000);
    var sdate = ("0" + start.getDate()).slice(-2)+"/"+("0" + (start.getMonth() + 1)).slice(-2)+"/"+start.getFullYear();
    var edate = ("0" + end.getDate()).slice(-2)+"/"+("0" + (end.getMonth() + 1)).slice(-2)+"/"+end.getFullYear();

    
    //pif = pif.replace(new RegExp('{FORMATION_START:DD/MM/YYYY}', 'gi'),start.getDate()+'/'+(start.getMonth()+1)+'/'+start.getFullYear());
    //pif = pif.replace(new RegExp('{FORMATION_END:<strong>DD/MM/YYYY</strong>}', 'gi'),end.getDate()+'/'+(end.getMonth()+1)+'/'+end.getFullYear());
    
    pif = pif.replace(new RegExp('{FORMATION_START:DD/MM/YYYY}', 'gi'),sdate);
    pif = pif.replace(new RegExp('{FORMATION_END:<strong>DD/MM/YYYY</strong>}', 'gi'),edate);
    
    total_duration = total_duration / 60 / 60;
    
    pif = pif.replace(new RegExp('{FORMATION_DURATION}', 'gi'),total_duration + ' heure(s)');
    
    pif = pif.replace(new RegExp('{TABLE_LIST}', 'gi'),htmlpif);
    pif = pif.replace(new RegExp('{TABLE_DONE}', 'gi'),htmlpif2);
    
    var pifsignature1 = 0;
    var pifsignature2 = 0;
    var pifsignature3 = 0;
    var pifsignature4 = 0;

    var fileSignature1 = MM.config.current_site.id+"/"+courseId+"/"+user+"_signature_manager_avant.png";
    var fileSignature2 = MM.config.current_site.id+"/"+courseId+"/"+user+"_signature_stagiaire_avant.png";
    if (version == 1) {
        var fileSignature3 = MM.config.current_site.id+"/"+courseId+"/"+user+"_signature_manager_apres.png";
        var fileSignature4 = MM.config.current_site.id+"/"+courseId+"/"+user+"_signature_stagiaire_apres.png";
    } else {
        var fileSignature3 = MM.config.current_site.id+"/"+courseId+"/"+user+"_"+version+"_signature_manager.png";
        var fileSignature4 = MM.config.current_site.id+"/"+courseId+"/"+user+"_"+version+"_signature_stagiaire.png";
    }
    
    var d = new Date();
    var today = parseInt(d.getTime()/1000);
                            
    
    
    MM.fs.findFileAndReadContents(fileSignature1,
        function(path) {
            pifsignature1 = path;
            pif = pif.replace(new RegExp('{SIGNATURE_AVANT_MANAGER}', 'gi'),'<img src="'+pifsignature1+'" width="300">');
            
            MM.fs.findFileAndReadContents(fileSignature2,
                function(path) {
                    pifsignature2 = path;
                    pif = pif.replace(new RegExp('{SIGNATURE_AVANT_PARTICIPANT}', 'gi'),'<img src="'+pifsignature2+'" width="300">');
                    
                    MM.fs.findFileAndReadContents(fileSignature3,
                        function(path) {
                            pifsignature3 = path;
                            pif = pif.replace(new RegExp('{SIGNATURE_APRES_MANAGER}', 'gi'),'<img src="'+pifsignature3+'" width="300">');
                            
                            MM.fs.findFileAndReadContents(fileSignature4,
                                function(path) {
                                    pifsignature4 = path;
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'<img src="'+pifsignature4+'" width="300">');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                },
                                function(path) {
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'');
                                     
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                }
                            );
                        },
                        function(path) {
                            pif = pif.replace(new RegExp('{SIGNATURE_APRES_MANAGER}', 'gi'),'');
                            
                            MM.fs.findFileAndReadContents(fileSignature4,
                                function(path) {
                                    pifsignature4 = path;
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'<img src="'+pifsignature4+'" width="300">');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                },
                                function(path) {
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                }
                            );
                        }
                    );
                },
                function(path) {
                    pif = pif.replace(new RegExp('{SIGNATURE_AVANT_PARTICIPANT}', 'gi'),'');
                    MM.fs.findFileAndReadContents(fileSignature3,
                        function(path) {
                            pifsignature3 = path;
                            pif = pif.replace(new RegExp('{SIGNATURE_APRES_MANAGER}', 'gi'),'<img src="'+pifsignature3+'" width="300">');
                            
                            MM.fs.findFileAndReadContents(fileSignature4,
                                function(path) {
                                    pifsignature4 = path;
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'<img src="'+pifsignature4+'" width="300">');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                },
                                function(path) {
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                }
                            );
                        },
                        function(path) {
                            pif = pif.replace(new RegExp('{SIGNATURE_APRES_MANAGER}', 'gi'),'');
                            
                            MM.fs.findFileAndReadContents(fileSignature4,
                                function(path) {
                                    pifsignature4 = path;
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'<img src="'+pifsignature4+'" width="300">');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                },
                                function(path) {
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                }
                            );
                        }
                    );
                }
            );
        },
        function(path) {
            pif = pif.replace(new RegExp('{SIGNATURE_AVANT_MANAGER}', 'gi'),'');
            
            MM.fs.findFileAndReadContents(fileSignature2,
                function(path) {
                    pifsignature2 = path;
                    pif = pif.replace(new RegExp('{SIGNATURE_AVANT_PARTICIPANT}', 'gi'),'<img src="'+pifsignature2+'" width="300">');
                    
                    MM.fs.findFileAndReadContents(fileSignature3,
                        function(path) {
                            pifsignature3 = path;
                            pif = pif.replace(new RegExp('{SIGNATURE_APRES_MANAGER}', 'gi'),'<img src="'+pifsignature3+'" width="300">');
                            
                            
                            MM.fs.findFileAndReadContents(fileSignature4,
                                function(path) {
                                    pifsignature4 = path;
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'<img src="'+pifsignature4+'" width="300">');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                },
                                function(path) {
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                }
                            );
                        },
                        function(path) {
                            pif = pif.replace(new RegExp('{SIGNATURE_APRES_MANAGER}', 'gi'),'');
                            
                            MM.fs.findFileAndReadContents(fileSignature4,
                                function(path) {
                                    pifsignature4 = path;
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'<img src="'+pifsignature4+'" width="300">');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                },
                                function(path) {
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                }
                            );
                        }
                    );
                },
                function(path) {
                    pif = pif.replace(new RegExp('{SIGNATURE_AVANT_PARTICIPANT}', 'gi'),'');
                    
                    MM.fs.findFileAndReadContents(fileSignature3,
                        function(path) {
                            pifsignature3 = path;
                            pif = pif.replace(new RegExp('{SIGNATURE_APRES_MANAGER}', 'gi'),'<img src="'+pifsignature3+'" width="300">');
                            
                            MM.fs.findFileAndReadContents(fileSignature4,
                                function(path) {
                                    pifsignature4 = path;
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'<img src="'+pifsignature4+'" width="300">');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                },
                                function(path) {
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                }
                            );
                        },
                        function(path) {
                           pif = pif.replace(new RegExp('{SIGNATURE_APRES_MANAGER}', 'gi'),'');
                           
                           MM.fs.findFileAndReadContents(fileSignature4,
                                function(path) {
                                    pifsignature4 = path;
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'<img src="'+pifsignature4+'" width="300">');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                },
                                function(path) {
                                    pif = pif.replace(new RegExp('{SIGNATURE_APRES_PARTICIPANT}', 'gi'),'');
                                    
                                    var html2 = '<div id="pifContent">'+pif+'</div>';
                                    var options2 = {
                                        title: 'Voir le pif de '+userpif.fullname,
                                        width: "100%",
                                        buttons: {}
                                    }
                                    options2.buttons["Fermer"] = function() {
                                        //MM.Router.navigate("eleves/" + course );
                                        $("#app-dialog").removeClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','100%');
                                        MM.widgets.dialogClose();
                                        $('button#pif[user="'+userpif.userid+'"]').click();
                                    };
                                    $("#app-dialog").addClass('full-screen-dialog2');
                                    $("#app-dialog .modalContent").css('height','85vh');
                                    MM.widgets.dialog(html2, options2);
				    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
                                    
                                }
                            );
                        }
                    );
                }
            );
        }
    );
    
    
                            
                            
}



//Amont             
function amont(button,user,course,version) {
    
    MM.log('Amont clicked');
    
    var button = button;
    var course = course;
    var courseId = course;
    var user = user;
    var version = version;
    var theuser = MM.db.get("users", MM.config.current_site.id + "-" + parseInt(user));

    var users = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var usergrille = users[0].toJSON();
    var grille = usergrille.grille;
    var pifs = usergrille.pif;
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == course;
    });
    
    var html = '<div id="pifContent">';
    html += '<h1 align="center" class="grille">Evaluation des compétences <span class="red">en amont</span> de la formation</h1><br/><br/><br/>';
    html += '<p align="center">Mettez le stagiaire en situation de travail et observez sa technique.</p>';
    html += '<p align="center">Vous pouvez observer votre stagiaire sur un ou plusieurs sites.</p>';
    html += '<p align="center">Veuillez sélectionner le site de votre choix.</p><br/><br/>';
    
    html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
    html += '<tr>';
    if (grille!="[]" && grille!="" && grille.q1 == 1){
        html += '<td style="width:33%;text-align:center"><p align="center">en cours</p></td>';
    }
    if (grille!="[]" && grille!="" && grille.q1 == 2){
        html += '<td style="width:33%;text-align:center"><p align="center">terminée</p></td>';
    }
    if (grille=="[]" || grille=="" || (grille!="[]" && grille!="" && (grille.q1 == 0 || grille.q1 == undefined || grille.q1 == ""))){
        html += '<td style="width:33%;text-align:center"><p align="center">&nbsp;</p></td>';
    }
    if (grille!="[]" && grille!="" && grille.q2 == 1){
        html += '<td style="width:33%;text-align:center"><p align="center">en cours</p></td>';
    }
    if (grille!="[]" && grille!="" && grille.q2 == 2){
        html += '<td style="width:33%;text-align:center"><p align="center">terminée</p></td>';
    }
    if (grille=="[]" || grille=="" || (grille!="[]" && grille!="" && (grille.q2 == 0 || grille.q2 == undefined || grille.q2 == ""))){
        html += '<td style="width:33%;text-align:center"><p align="center">&nbsp;</p></td>';
    }
    if (grille!="[]" && grille!="" && grille.q3 == 1){
        html += '<td style="width:33%;text-align:center"><p align="center">en cours</p></td>';
    }
    if (grille!="[]" && grille!="" && grille.q3 == 2){
        html += '<td style="width:33%;text-align:center"><p align="center">terminée</p></td>';
    }
    if (grille=="[]" || grille=="" || (grille!="[]" && grille!="" && (grille.q3 == 0 || grille.q3 == undefined || grille.q3 == ""))){
        html += '<td style="width:33%;text-align:center"><p align="center">&nbsp;</p></td>';
    }
    html += '</tr>';
    html += '<tr>';
   
    if (grille!="[]" && grille!="" && grille.q1 == 2){
        html += '<td style="width:33%;text-align:center"><button onclick="grillea1(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea1" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-9">BUREAU</button></td>';
    } else {
        html += '<td style="width:33%;text-align:center"><button onclick="grillea1(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea1" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-5">BUREAU</button></td>';
    }
    if (grille!="[]" && grille!="" && grille.q2 == 2){
        html += '<td style="width:33%;text-align:center"><button onclick="grillea2(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea2" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-9">SANITAIRE</button></td>';
    } else {
        html += '<td style="width:33%;text-align:center"><button onclick="grillea2(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea2" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-5">SANITAIRE</button></td>';
    }
    if (grille!="[]" && grille!="" && grille.q3 == 2){
        html += '<td style="width:33%;text-align:center"><button onclick="grillea3(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea3" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-9">PARTIES COMMUNES</button></td>';
    } else {
        html += '<td style="width:33%;text-align:center"><button onclick="grillea3(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea3" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-5">PARTIES COMMUNES</button></td>';
    }
    html += '</tr>';
    html += '</table>';
    
    if (grille!="[]" && grille!="" && (grille.q1 == 2 || grille.q2 == 2 || grille.q3 == 2 ) && (pifscourse.length == 0)) {
        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
        html += '<tr>';
        html += '<td style="text-align:center"><button onclick="modifierPif(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:50%;height:50px" class="modal-button-7">VALIDER et SIGNER LE PIF</button></td>';
        html += '</tr>';
        html += '</table>';
    }
    
    if (grille!="[]" && grille!="" && (grille.q1 == 2 || grille.q2 == 2 || grille.q3 == 2 ) && (pifscourse.length > 0)) {
        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
        html += '<tr>';
        html += '<td style="text-align:center"><button onclick="modifierPif(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:50%;height:50px" class="modal-button-7">MODIFIER et SIGNER LE PIF</button></td>';
        html += '</tr>';
        html += '</table>';
    }
    
   
    html += '</div>';
    
    
    var options = {
        title: 'Stagiaire : '+usergrille.fullname,
        width: "98%",
        marginTop: "5%",
        buttons: {}
    };
    
    
    options.buttons["Fermer"] = function() {
        MM.Router.navigate("eleves/" + course );
        MM.widgets.dialogClose();
        //$('button#creerpif[user="'+usergrille.userid+'"]').click();
    };
    
   
    $("#app-dialog").addClass('full-screen-dialog2');
    $("#app-dialog .modalContent").css('height','85vh');
    MM.widgets.dialog(html, options);
    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px"; 
}

//Aval             
function aval(button,user,course,version) {
    
    MM.log('Aval clicked');
    
    var button = button;
    var course = course;
    var courseId = course;
    var user = user;
    var version = version;
    var theuser = MM.db.get("users", MM.config.current_site.id + "-" + parseInt(user));

    var users = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var usergrille = users[0].toJSON();
    var grille = usergrille.grille;
    var pifs = usergrille.pif;
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == course;
    });
    
    var html = '<div id="pifContent">';
    html += '<h1 align="center" class="grille">Evaluation des compétences <span class="red">en aval</span> de la formation</h1><br/><br/><br/><br/>';
    html += '<p align="center"><i>Principe : Mettez le stagiaire en situation de travail et observez sa technique.</i></p><br/>';
    html += '<p align="center">Vous pouvez observer votre stagiaire sur un ou plusieurs sites.</p><br/>';
    html += '<p align="center">Veuillez sélectionner le site de votre choix.</p><br/><br/><br/><br/>';
    
    html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
    html += '<tr>';
    if (grille!="[]" && grille!="" && grille.q4 == 1){
        html += '<td style="width:33%;text-align:center"><p align="center">en cours</p></td>';
    }
    if (grille!="[]" && grille!="" && grille.q4 == 2){
        html += '<td style="width:33%;text-align:center"><p align="center">terminée</p></td>';
    }
    if (grille=="[]" || grille=="" || (grille!="[]" && grille!="" && (grille.q4 == 0 || grille.q4 == undefined || grille.q4 == ""))){
        html += '<td style="width:33%;text-align:center"><p align="center">&nbsp;</p></td>';
    }
    if (grille!="[]" && grille!="" && grille.q5 == 1){
        html += '<td style="width:33%;text-align:center"><p align="center">en cours</p></td>';
    }
    if (grille!="[]" && grille!="" && grille.q5 == 2){
        html += '<td style="width:33%;text-align:center"><p align="center">terminée</p></td>';
    }
    if (grille=="[]" || grille=="" || (grille!="[]" && grille!="" && (grille.q5 == 0 || grille.q5 == undefined || grille.q5 == ""))){
        html += '<td style="width:33%;text-align:center"><p align="center">&nbsp;</p></td>';
    }
    if (grille!="[]" && grille!="" && grille.q6 == 1){
        html += '<td style="width:33%;text-align:center"><p align="center">en cours</p></td>';
    }
    if (grille!="[]" && grille!="" && grille.q6 == 2){
        html += '<td style="width:33%;text-align:center"><p align="center">terminée</p></td>';
    }
    if (grille=="[]" || grille=="" || (grille!="[]" && grille!="" && (grille.q6 == 0 || grille.q6 == undefined || grille.q6 == ""))){
        html += '<td style="width:33%;text-align:center"><p align="center">&nbsp;</p></td>';
    }
    html += '</tr>';
    html += '<tr>';
    if (grille!="[]" && grille!="" && grille.q4 == 2){
        html += '<td style="width:33%;text-align:center"><button onclick="grillea4(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea4" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-9">BUREAU</button></td>';
    } else {
        html += '<td style="width:33%;text-align:center"><button onclick="grillea4(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea4" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-5">BUREAU</button></td>';
    }
    if (grille!="[]" && grille!="" && grille.q5 == 2){
        html += '<td style="width:33%;text-align:center"><button onclick="grillea5(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea5" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-9">SANITAIRE</button></td>';
    } else {
        html += '<td style="width:33%;text-align:center"><button onclick="grillea5(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea5" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-5">SANITAIRE</button></td>';
    }
    if (grille!="[]" && grille!="" && grille.q6 == 2){
        html += '<td style="width:33%;text-align:center"><button onclick="grillea6(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea6" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-9">PARTIES COMMUNES</button></td>';
    } else {
        html += '<td style="width:33%;text-align:center"><button onclick="grillea§(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="grillea6" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:90%;height:50px" class="modal-button-5">PARTIES COMMUNES</button></td>';
    }
    
    html += '</tr>';
    html += '</table>';
    
    if (grille!="[]" && grille!="" && (grille.q4 == 2 || grille.q5 == 2 || grille.q6 == 2 ) && (pifscourse.length == 0)) {
        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
        html += '<tr>';
        html += '<td style="text-align:center"><button onclick="modifierPif(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:50%;height:50px" class="modal-button-7">VALIDER et SIGNER LE PIF</button></td>';
        html += '</tr>';
        html += '</table>';
    }
    
    if (grille!="[]" && grille!="" && (grille.q4 == 2 || grille.q5 == 2 || grille.q6 == 2 ) && (pifscourse.length > 0)) {
        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
        html += '<tr>';
        html += '<td style="text-align:center"><button onclick="modifierPif(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"  version="'+version+'" style="width:50%;height:50px" class="modal-button-7">MODIFIER et SIGNER LE PIF</button></td>';
        html += '</tr>';
        html += '</table>';
    }
    
   
    html += '</div>';
    
    
    var options = {
        title: 'Stagiaire : '+usergrille.fullname,
        width: "98%",
        marginTop: "5%",
        buttons: {}
    };
    
    
    options.buttons["Fermer"] = function() {
        MM.Router.navigate("eleves/" + course );
        MM.widgets.dialogClose();
        //$('button#creerpif[user="'+usergrille.userid+'"]').click();
    };
    
   
    $("#app-dialog").addClass('full-screen-dialog2');
    $("#app-dialog .modalContent").css('height','85vh');
    MM.widgets.dialog(html, options);
    document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px"; 
}

function initGrille(user) {
        grille={};
        grille.q1am = -1;
        grille.q2am = -1;
        grille.q3am = -1;
        grille.q4am = -1;
        grille.q5am = -1;
        grille.q6am = -1;
        grille.q7am = -1;
        grille.q8am = -1;
        grille.q9am = -1;
        grille.q10am = -1;
        grille.q11am = -1;
        grille.q12am = -1;
        grille.q13am = -1;
        grille.q14am = -1;
        grille.q15am = -1;
        grille.q16am = -1;
        grille.q17am = -1;
        grille.q18am = -1;
        grille.q19am = -1;
        grille.q20am = -1;
        grille.q1 = 0;
        grille.q2 = 0;
        grille.q3 = 0;
        
        grille.q1av = -1;
        grille.q2av = -1;
        grille.q3av = -1;
        grille.q4av = -1;
        grille.q5av = -1;
        grille.q6av = -1;
        grille.q7av = -1;
        grille.q8av = -1;
        grille.q9av = -1;
        grille.q10av = -1;
        grille.q11av = -1;
        grille.q12av = -1;
        grille.q13av = -1;
        grille.q14av = -1;
        grille.q15av = -1;
        grille.q16av = -1;
        grille.q17av = -1;
        grille.q18av = -1;
        grille.q19av = -1;
        grille.q20av = -1;
        grille.q21av = -1;
        grille.q22av = -1;
        grille.q23av = -1;
        grille.q24av = -1;
        grille.q25av = -1;
        grille.q26av = -1;
        grille.q27av = -1;
        grille.q28av = -1;
        grille.q29av = -1;
        grille.q30av = -1;
        grille.q31av = -1;
        grille.q32av = -1;
        grille.q33av = -1;
        grille.q34av = -1;
        grille.q35av = -1;
        grille.q36av = -1;
        grille.q37av = -1;
        grille.q38av = -1;
        grille.q39av = -1;
        grille.q40av = -1;
        grille.q41av = -1;
        grille.q42av = -1;
        grille.q43av = -1;
        grille.q44av = -1;
        grille.q45av = -1;
        grille.q46av = -1;
        grille.q47av = -1;
        grille.q48av = -1;
        grille.q49av = -1;
        grille.q50av = -1;
        grille.q51av = -1;
        grille.q52av = -1;
        grille.q53av = -1;
        grille.q54av = -1;
        grille.q55av = -1;
        grille.q56av = -1;
        grille.q57av = -1;
        grille.q58av = -1;
        grille.q59av = -1;
        grille.q60av = -1;
        grille.q61av = -1;
        grille.q62av = -1;
        grille.q63av = -1;
        grille.q64av = -1;
        grille.q65av = -1;
        grille.q66av = -1;
        grille.q67av = -1;
        grille.q68av = -1;
        grille.q69av = -1;
        grille.q70av = -1;
        grille.q71av = -1;
        grille.q72av = -1;
        grille.q73av = -1;
        grille.q74av = -1;
        grille.q75av = -1;
        grille.q76av = -1;
        grille.q77av = -1;
        grille.q78av = -1;
        grille.q79av = -1;
        grille.q80av = -1;
        grille.q81av = -1;
        grille.q82av = -1;
        grille.q83av = -1;
        grille.q84av = -1;
        grille.q85av = -1;
        grille.q86av = -1;
        grille.q4=0;
        grille.q5=0;
        grille.q6=0;
        
        user.save({grille:grille});
        
        return grille;
}
//Grille A1             
function grillea1(button,user,course,version) {
    
    MM.log('GRILLEA1 clicked');
    
    var button = button;
    var course = course;
    var courseId = course;
    var user = user;
    var version = version;
    var thisuser = MM.db.get("users", MM.config.current_site.id + "-" + user);
    
    var users = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var usergrille = users[0].toJSON();
    var grille = usergrille.grille;
    var pifs = usergrille.pif;
    MM.log('User:'+users[0]+'/UserGrille:'+usergrille+'/Grille:'+grille+'/Pif:'+pifs);
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == course;
    });
    
    if (grille!="[]" && grille!="" && grille.q1 == 2)
        var disabled = 'disabled="disabled"';
    else disabled='';
    
    if (grille=="[]" || grille=="") {
        grille = initGrille(thisuser);
    }
    
    var highlight = ' style="background-color:#ff0000"';
    var style="";
    
    var html = '<div id="pifContent" style="overflow-y:hidden">';
    html += '<h1 align="center" class="grille">Evaluation des compétences <span class="red">en amont</span> de la formation</h1>';
    html += '<h1 align="center" class="grille">Grille de positionnement <span class="red">Bureau</span></h1>';
    //html += '<h2 align="left" class="grille">Bureau</h2>';
    
    html += '<div id="firstcolumngrille">';
    html += '<div id="firstblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo" style="border:0px;background-color:#fff">';
    //html+='<tr style="border:0px;background-color:#fff;"><td style="width:50%;border:0px">&nbsp;</td><td style="width:16%;border:0px"><div id="cellmodule" style="width:50px;height:160px"><div id="grillenote"><strong>Non fait</strong></div></div></td><td style="width:16%;border:0px"><div id="cellmodule" style="width:50px;height:160px"><div id="grillenote"><strong>Partiellement fait</strong></div></div></td><td style="border:0px;width:16%"><div id="cellmodule" style="width:50px;height:160px"><div id="grillenote"><strong>Fait</strong></div></div></td></tr>';
    html+='<tr style="border:0px;background-color:#fff;"><td style="width:50%;border:0px">&nbsp;</td><td style="width:16%;border:0px"><strong>Non fait</strong></td><td style="width:16%;border:0px"><strong>Partiellement fait</strong></td><td style="border:0px;width:16%"><strong>Fait</strong></td></tr>';
    
    html+='</table>';
    html+='</div>';
    
    html += '<div id="secondblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
    html+= '<tr><td colspan="4"></td></tr>';
    
    //QUESTION Q1AM
    MM.log('Check Q1AM:'+grille.q1+'/'+grille.q1am);
    if (grille.q1 == 1 && grille.q1am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">1/10. L\'agent identifie les attentes des clients</td>';
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1am" value="0" '+disabled;
    if (grille.q1am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1am" value="1" '+disabled;
    if (grille.q1am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1am" value="2" '+disabled;
    if (grille.q1am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q2AM
    if (grille.q1 == 1 && grille.q2am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">2/10. L\'agent applique les règles de communication</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2am" value="0" '+disabled;
    if (grille.q2am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2am" value="1" '+disabled;
    if (grille.q2am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2am" value="2" '+disabled;
    if (grille.q2am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q3AM
    if (grille.q1 == 1 && grille.q3am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">3/10. L\'agent traite les demandes et les réclamations</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3am" value="0" '+disabled;
    if (grille.q3am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3am" value="1" '+disabled;
    if (grille.q3am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3am" value="2" '+disabled;
    if (grille.q3am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q4AM
    if (grille.q1 == 1 && grille.q4am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">4/10. L\'agent nomme les éléments à nettoyer</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4am" value="0" '+disabled;
    if (grille.q4am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4am" value="1" '+disabled;
    if (grille.q4am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4am" value="2" '+disabled;
    if (grille.q4am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q5AM
    if (grille.q1 == 1 && grille.q5am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">5/10. L\'agent utilise le matériel et les produits de nettoyage</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q5am" value="0" '+disabled;
    if (grille.q5am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q5am" value="1" '+disabled;
    if (grille.q5am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q5am" value="2" '+disabled;
    if (grille.q5am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q6AM
    if (grille.q1 == 1 && grille.q6am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">6/10. L\'agent applique les protocoles de nettoyage</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6am" value="0" '+disabled;
    if (grille.q6am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6am" value="1" '+disabled;
    if (grille.q6am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6am" value="2" '+disabled;
    if (grille.q6am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q7AM
    if (grille.q1 == 1 && grille.q7am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">7/10. L\'agent applique les règles d\'hygiène et de sécurité</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7am" value="0" '+disabled;
    if (grille.q7am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7am" value="1" '+disabled;
    if (grille.q7am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7am" value="2" '+disabled;
    if (grille.q7am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q8AM
    if (grille.q1 == 1 && grille.q8am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">8/10. L\'agent applique les attitudes de services</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8am" value="0" '+disabled;
    if (grille.q8am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8am" value="1" '+disabled;
    if (grille.q8am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8am" value="2" '+disabled;
    if (grille.q8am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q9AM
    if (grille.q1 == 1 && grille.q9am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">9/10. L\'agent adopte les bonnes postures de travail</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q9am" value="0" '+disabled;
    if (grille.q9am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q9am" value="1" '+disabled;
    if (grille.q9am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q9am" value="2" '+disabled;
    if (grille.q9am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q10AM
    if (grille.q1 == 1 && grille.q10am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">10/10. L\'agent travaille en objectif de résultats</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10am" value="0" '+disabled;
    if (grille.q10am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10am" value="1" '+disabled;
    if (grille.q10am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10am" value="2" '+disabled;
    if (grille.q10am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    html+='</table>';
    html += '</div>';
    
    html += '</div>';
    html += '</div>';
    
    var options2 = {
            title: 'Stagiaire : '+usergrille.fullname,
            width: "98%",
            marginTop: "5%",
            buttons: {}
        };
    
    //Grille 1 Validée
    if (grille!="[]" && grille!="" && grille.q1 == 2){
        
        options2.buttons["Fermer"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            amont(button,user,course,version);
        };
        options2.buttons["Fermer"]["style"] = "modal-button-8";
        
    } else {
        
        
        
        options2.buttons["Annuler"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            amont(button,user,course,version);
        };
        options2.buttons["Annuler"]["style"] = "modal-button-8";
        
        options2.buttons["Enregistrer"] = function() {
            
            MM.log('Enregistrer Grille 1A');
            if (grille=="") {
                grille={};
            }
            grille.q1am = $('input[name=q1am]:checked').val() ? $('input[name=q1am]:checked').val() : -1;
            grille.q2am = $('input[name=q2am]:checked').val() ? $('input[name=q2am]:checked').val() : -1;
            grille.q3am = $('input[name=q3am]:checked').val() ? $('input[name=q3am]:checked').val() : -1;
            grille.q4am = $('input[name=q4am]:checked').val() ? $('input[name=q4am]:checked').val() : -1;
            grille.q5am = $('input[name=q5am]:checked').val() ? $('input[name=q5am]:checked').val() : -1;
            grille.q6am = $('input[name=q6am]:checked').val() ? $('input[name=q6am]:checked').val() : -1;
            grille.q7am = $('input[name=q7am]:checked').val() ? $('input[name=q7am]:checked').val() : -1;
            grille.q8am = $('input[name=q8am]:checked').val() ? $('input[name=q8am]:checked').val() : -1;
            grille.q9am = $('input[name=q9am]:checked').val() ? $('input[name=q9am]:checked').val() : -1;
            grille.q10am = $('input[name=q10am]:checked').val() ? $('input[name=q10am]:checked').val() : -1;
            grille.q1 = 1;
            
            MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
            
            thisuser.save({grille:grille});
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            amont(button,user,course,version);
            
        };
        options2.buttons["Enregistrer"]["style"] = "modal-button-6";
        
        options2.buttons["Valider la grille"] = function() {
            
            MM.log('Valider Grille 1A');
            
            if(!$('input[name=q1am]').is(':checked') || !$('input[name=q2am]').is(':checked') || !$('input[name=q3am]').is(':checked') || !$('input[name=q4am]').is(':checked') || !$('input[name=q5am]').is(':checked') || !$('input[name=q6am]').is(':checked') || !$('input[name=q7am]').is(':checked') || !$('input[name=q8am]').is(':checked') || !$('input[name=q9am]').is(':checked') || !$('input[name=q10am]').is(':checked')) {
            //if (!tested) {    
                MM.log('Grille Incomplete');
                
                var options3= {
                    title: '',
                    buttons: {}
                };
                
                options3.buttons["Fermer"] = function() {
                    MM.widgets.dialogClose2();
                    grille.q1am = $('input[name=q1am]:checked').val() ? $('input[name=q1am]:checked').val() : -1;
                    grille.q2am = $('input[name=q2am]:checked').val() ? $('input[name=q2am]:checked').val() : -1;
                    grille.q3am = $('input[name=q3am]:checked').val() ? $('input[name=q3am]:checked').val() : -1;
                    grille.q4am = $('input[name=q4am]:checked').val() ? $('input[name=q4am]:checked').val() : -1;
                    grille.q5am = $('input[name=q5am]:checked').val() ? $('input[name=q5am]:checked').val() : -1;
                    grille.q6am = $('input[name=q6am]:checked').val() ? $('input[name=q6am]:checked').val() : -1;
                    grille.q7am = $('input[name=q7am]:checked').val() ? $('input[name=q7am]:checked').val() : -1;
                    grille.q8am = $('input[name=q8am]:checked').val() ? $('input[name=q8am]:checked').val() : -1;
                    grille.q9am = $('input[name=q9am]:checked').val() ? $('input[name=q9am]:checked').val() : -1;
                    grille.q10am = $('input[name=q10am]:checked').val() ? $('input[name=q10am]:checked').val() : -1;
                    grille.q1 = 1;
                    
                    MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
                    
                    thisuser.save({grille:grille});
                    MM.Router.navigate("eleves/" + course );
                    MM.widgets.dialogClose();
                    grillea1(button,user,course,version);
                };
                
                var html3 = "Pour valider, veuillez compléter entièrement la grille de positionnement.";
               
                MM.widgets.dialog2(html3, options3);
                
            } else {
                
                MM.log('Grille Complete');
                if (grille=="") {
                    grille={};
                }
                
                grille.q1am = $('input[name=q1am]:checked').val();
                grille.q2am = $('input[name=q2am]:checked').val();
                grille.q3am = $('input[name=q3am]:checked').val();
                grille.q4am = $('input[name=q4am]:checked').val();
                grille.q5am = $('input[name=q5am]:checked').val();
                grille.q6am = $('input[name=q6am]:checked').val();
                grille.q7am = $('input[name=q7am]:checked').val();
                grille.q8am = $('input[name=q8am]:checked').val();
                grille.q9am = $('input[name=q9am]:checked').val();
                grille.q10am = $('input[name=q10am]:checked').val();
                grille.q1 = 2;
                
                MM.log('Grille:'+grille+'/'+grille.q1);
                
                var options4= {
                    title: '',
                    buttons: {}
                };
                options4.buttons["Annuler"] = function() {
                    MM.widgets.dialogClose2();
                };
                
                options4.buttons["Je valide"] = function() {
                    MM.log('Enregistrer et Valider Grille 1A');
                    thisuser.save({grille:grille});
                    //$('button#creerpif[user="'+user+'"]').replaceWith('<button onclick="clickPif($(this),$(this).attr(\'course\'),$(this).attr(\'user\'),$(this).attr(\'version\'),$(this).attr(\'pif\'))" class="btn grd-grisfonce text-blanc" id="pif" pif="" course="'+course+'" version="1" user="'+user+'" path="" module="" class="btn grd-grisfonce text-rouge">PIF</button>');
                    //$('button#creerpif[user="'+user+'"]').unbind('click');
                    //$('button#creerpif[user="'+user+'"]').attr('id','pif');
                    //$('button#pif[user="'+user+'"]').html('PIF');
                    //$('button#pif[user="'+user+'"]').attr('class','btn grd-grisfonce text-blanc');
                    
                    MM.Router.navigate("eleves/" + course, {trigger: true} );
                    
                    MM.widgets.dialogClose2();
                    MM.widgets.dialogClose();
                    amont($('button#pif[user="'+user+'"]'),user,course,version);
                    
                };
                
                var html4 = "En validant la grille, vous mettrez à jour le Protocole de Formation (PIF) de votre stagiaire.<br/>Vos réponses ne pourront plus être modifiées.";
               
                MM.widgets.dialog2(html4, options4);
                
                
                
            }
            
        };
        options2.buttons["Valider la grille"]["style"] = "modal-button-7";
    }
    
    $("#app-dialog").addClass('full-screen-dialog2');
    $("#app-dialog .modalContent").css('height','85vh');
    MM.widgets.dialog(html, options2);
    //document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
    document.getElementById("pifContent").style.height = (window.innerHeight - 134) + "px";
    document.getElementById("pifContent").style.maxHeight = (window.innerHeight - 134) + "px";
    document.getElementById("secondblock").style.height = (window.innerHeight - 284) + "px";
}



//Grille A2             
function grillea2(button,user,course,version) {
    
    MM.log('GRILLEA2 clicked');
    
    var button = button;
    var course = course;
    var courseId = course;
    var user = user;
    var version = version;
    var thisuser = MM.db.get("users", MM.config.current_site.id + "-" + user);
    
    
    var users = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var usergrille = users[0].toJSON();
    var grille = usergrille.grille;
    var pifs = usergrille.pif;
    MM.log('User:'+users[0]+'/UserGrille:'+usergrille+'/Grille:'+grille+'/Pif:'+pifs);
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == course;
    });
    
    if (grille!="[]" && grille!="" && grille.q2 == 2)
        var disabled = 'disabled="disabled"';
    else disabled='';
    
    if (grille=="[]" || grille=="") {
        grille = initGrille(thisuser);
    }
    
    var highlight = ' style="background-color:#ff0000"';
    var style="";
    
    var html = '<div id="pifContent" style="overflow-y:hidden">';
    html += '<h1 align="center" class="grille">Evaluation des compétences <span class="red">en amont</span> de la formation</h1>';
    html += '<h1 align="center" class="grille">Grille de positionnement <span class="red">Sanitaire</span></h1>';
    
    html += '<div id="firstcolumngrille">';
    html += '<div id="firstblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo" style="border:0px;background-color:#fff">';
    html+='<tr style="border:0px;background-color:#fff;"><td style="width:50%;border:0px">&nbsp;</td><td style="width:16%;border:0px"><strong>Non fait</strong></td><td style="width:16%;border:0px"><strong>Partiellement fait</strong></td><td style="border:0px;width:16%"><strong>Fait</strong></td></tr>';
    html+='</table>';
    html+='</div>';
    
    html += '<div id="secondblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
    html+= '<tr><td colspan="4"></td></tr>';
    
    //QUESTION Q1AM
    if (grille.q2 == 1 && grille.q1am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">1/10. L\'agent identifie les attentes des clients</td>';
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1am" value="0" '+disabled;
    if (grille.q1am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1am" value="1" '+disabled;
    if (grille.q1am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1am" value="2" '+disabled;
    if (grille.q1am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q2AM
    if (grille.q2 == 1 && grille.q2am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">2/10. L\'agent applique les règles de communication</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2am" value="0" '+disabled;
    if (grille.q2am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2am" value="1" '+disabled;
    if (grille.q2am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2am" value="2" '+disabled;
    if (grille.q2am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q3AM
    if (grille.q2 == 1 && grille.q3am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">3/10. L\'agent traite les demandes et les réclamations</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3am" value="0" '+disabled;
    if (grille.q3am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3am" value="1" '+disabled;
    if (grille.q3am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3am" value="2" '+disabled;
    if (grille.q3am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q4AM
    if (grille.q2 == 1 && grille.q4am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">4/10. L\'agent nomme les éléments à nettoyer</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4am" value="0" '+disabled;
    if (grille.q4am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4am" value="1" '+disabled;
    if (grille.q4am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4am" value="2" '+disabled;
    if (grille.q4am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q11AM
    if (grille.q2 == 1 && grille.q11am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">5/10. L\'agent utilise le matériel et les produits de nettoyage</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q11am" value="0" '+disabled;
    if (grille.q11am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q11am" value="1" '+disabled;
    if (grille.q11am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q11am" value="2" '+disabled;
    if (grille.q11am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q12AM
    if (grille.q2 == 1 && grille.q12am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">6/10. L\'agent applique les protocoles de nettoyage</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12am" value="0" '+disabled;
    if (grille.q12am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12am" value="1" '+disabled;
    if (grille.q12am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12am" value="2" '+disabled;
    if (grille.q12am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q13AM
    if (grille.q2 == 1 && grille.q13am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">7/10. L\'agent applique les règles d\'hygiène et de sécurité</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13am" value="0" '+disabled;
    if (grille.q13am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13am" value="1" '+disabled;
    if (grille.q13am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13am" value="2" '+disabled;
    if (grille.q13am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q14AM
    if (grille.q2 == 1 && grille.q14am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">8/10. L\'agent applique les attitudes de services</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14am" value="0" '+disabled;
    if (grille.q14am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14am" value="1" '+disabled;
    if (grille.q14am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14am" value="2" '+disabled;
    if (grille.q14am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q15AM
    if (grille.q2 == 1 && grille.q15am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">9/10. L\'agent adopte les bonnes postures de travail</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15am" value="0" '+disabled;
    if (grille.q15am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15am" value="1" '+disabled;
    if (grille.q15am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15am" value="2" '+disabled;
    if (grille.q15am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q10AM
    if (grille.q2 == 1 && grille.q10am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">10/10. L\'agent travaille en objectif de résultats</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10am" value="0" '+disabled;
    if (grille.q10am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10am" value="1" '+disabled;
    if (grille.q10am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10am" value="2" '+disabled;
    if (grille.q10am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    html+='</table>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    var options2 = {
            title: 'Stagiaire : '+usergrille.fullname,
            width: "98%",
            marginTop: "5%",
            buttons: {}
        };
    
    //Grille 1 Validée
    if (grille!="[]" && grille!="" && grille.q2 == 2){
        
        options2.buttons["Fermer"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            amont(button,user,course,version);
        };
        options2.buttons["Fermer"]["style"] = "modal-button-8";
        
    } else {
        
        
        
        options2.buttons["Annuler"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            amont(button,user,course,version);
        };
        options2.buttons["Annuler"]["style"] = "modal-button-8";
        
        options2.buttons["Enregistrer"] = function() {
            
            MM.log('Enregistrer Grille 1A');
            if (grille=="") {
                grille={};
            }
            grille.q1am = $('input[name=q1am]:checked').val() ? $('input[name=q1am]:checked').val() : -1;
            grille.q2am = $('input[name=q2am]:checked').val() ? $('input[name=q2am]:checked').val() : -1;
            grille.q3am = $('input[name=q3am]:checked').val() ? $('input[name=q3am]:checked').val() : -1;
            grille.q4am = $('input[name=q4am]:checked').val() ? $('input[name=q4am]:checked').val() : -1;
            grille.q11am = $('input[name=q11am]:checked').val() ? $('input[name=q11am]:checked').val() : -1;
            grille.q12am = $('input[name=q12am]:checked').val() ? $('input[name=q12am]:checked').val() : -1;
            grille.q13am = $('input[name=q13am]:checked').val() ? $('input[name=q13am]:checked').val() : -1;
            grille.q14am = $('input[name=q14am]:checked').val() ? $('input[name=q14am]:checked').val() : -1;
            grille.q15am = $('input[name=q15am]:checked').val() ? $('input[name=q15am]:checked').val() : -1;
            grille.q10am = $('input[name=q10am]:checked').val() ? $('input[name=q10am]:checked').val() : -1;
            grille.q2 = 1;
            
            MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
            
            thisuser.save({grille:grille});
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            amont(button,user,course,version);
            
        };
        options2.buttons["Enregistrer"]["style"] = "modal-button-6";
        
        options2.buttons["Valider la grille"] = function() {
            
            MM.log('Valider Grille 1A');
            
            if(!$('input[name=q1am]').is(':checked') || !$('input[name=q2am]').is(':checked') || !$('input[name=q3am]').is(':checked') || !$('input[name=q4am]').is(':checked') || !$('input[name=q11am]').is(':checked') || !$('input[name=q12am]').is(':checked') || !$('input[name=q13am]').is(':checked') || !$('input[name=q14am]').is(':checked') || !$('input[name=q15am]').is(':checked') || !$('input[name=q10am]').is(':checked')) {
            //if (!tested) {    
                MM.log('Grille Incomplete');
                
                var options3= {
                    title: '',
                    buttons: {}
                };
                
                options3.buttons["Fermer"] = function() {
                    MM.widgets.dialogClose2();
                    grille.q1am = $('input[name=q1am]:checked').val() ? $('input[name=q1am]:checked').val() : -1;
                    grille.q2am = $('input[name=q2am]:checked').val() ? $('input[name=q2am]:checked').val() : -1;
                    grille.q3am = $('input[name=q3am]:checked').val() ? $('input[name=q3am]:checked').val() : -1;
                    grille.q4am = $('input[name=q4am]:checked').val() ? $('input[name=q4am]:checked').val() : -1;
                    grille.q11am = $('input[name=q11am]:checked').val() ? $('input[name=q11am]:checked').val() : -1;
                    grille.q12am = $('input[name=q12am]:checked').val() ? $('input[name=q12am]:checked').val() : -1;
                    grille.q13am = $('input[name=q13am]:checked').val() ? $('input[name=q13am]:checked').val() : -1;
                    grille.q14am = $('input[name=q14am]:checked').val() ? $('input[name=q14am]:checked').val() : -1;
                    grille.q15am = $('input[name=q15am]:checked').val() ? $('input[name=q15am]:checked').val() : -1;
                    grille.q10am = $('input[name=q10am]:checked').val() ? $('input[name=q10am]:checked').val() : -1;
                    grille.q2 = 1;
                    
                    MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
                    
                    thisuser.save({grille:grille});
                    MM.Router.navigate("eleves/" + course );
                    MM.widgets.dialogClose();
                    grillea2(button,user,course,version);
                };
                
                var html3 = "Pour valider, veuillez compléter entièrement la grille de positionnement.";
               
                MM.widgets.dialog2(html3, options3);
                document.getElementById("pifContent").style.height = ((window.innerHeight * 70)/100) + "px";
                
            } else {
                
                MM.log('Grille Complete');
                if (grille=="") {
                    grille={};
                }
                
                grille.q1am = $('input[name=q1am]:checked').val();
                grille.q2am = $('input[name=q2am]:checked').val();
                grille.q3am = $('input[name=q3am]:checked').val();
                grille.q4am = $('input[name=q4am]:checked').val();
                grille.q11am = $('input[name=q11am]:checked').val();
                grille.q12am = $('input[name=q12am]:checked').val();
                grille.q13am = $('input[name=q13am]:checked').val();
                grille.q14am = $('input[name=q14am]:checked').val();
                grille.q15am = $('input[name=q15am]:checked').val();
                grille.q10am = $('input[name=q10am]:checked').val();
                grille.q2 = 2;
                
                MM.log('Grille:'+grille+'/'+grille.q1);
                
                var options4= {
                    title: '',
                    buttons: {}
                };
                options4.buttons["Annuler"] = function() {
                    MM.widgets.dialogClose2();
                };
                
                options4.buttons["Je valide"] = function() {
                    MM.log('Enregistrer et Valider Grille 1A');
                    thisuser.save({grille:grille});
                    //$('button#creerpif[user="'+user+'"]').replaceWith('<button onclick="clickPif($(this),$(this).attr(\'course\'),$(this).attr(\'user\'),$(this).attr(\'version\'),$(this).attr(\'pif\'))" class="btn grd-grisfonce text-blanc" id="pif" pif="" course="'+course+'" version="1" user="'+user+'" path="" module="" class="btn grd-grisfonce text-rouge">PIF</button>');
                    //$('button#creerpif[user="'+user+'"]').unbind('click');
                    //$('button#creerpif[user="'+user+'"]').attr('id','pif');
                    //$('button#pif[user="'+user+'"]').html('PIF');
                    //$('button#pif[user="'+user+'"]').attr('class','btn grd-grisfonce text-blanc');
                    
                    MM.Router.navigate("eleves/" + course, {trigger: true} );
                    
                    MM.widgets.dialogClose2();
                    MM.widgets.dialogClose();
                    amont($('button#pif[user="'+user+'"]'),user,course,version);
                    
                };
                
                var html4 = "En validant la grille, vous mettrez à jour le Protocole de Formation (PIF) de votre stagiaire.<br/>Vos réponses ne pourront plus être modifiées.";
               
                MM.widgets.dialog2(html4, options4);
                document.getElementById("pifContent").style.height = ((window.innerHeight * 70)/100) + "px";
                
                
                
            }
            
        };
        options2.buttons["Valider la grille"]["style"] = "modal-button-7";
    }
    
    $("#app-dialog").addClass('full-screen-dialog2');
    $("#app-dialog .modalContent").css('height','85vh');
    MM.widgets.dialog(html, options2);
    //document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
    document.getElementById("pifContent").style.height = (window.innerHeight - 134) + "px";
    document.getElementById("pifContent").style.maxHeight = (window.innerHeight - 134) + "px";
    document.getElementById("secondblock").style.height = (window.innerHeight - 284) + "px";
}


//Grille A3             
function grillea3(button,user,course,version) {
    
    MM.log('GRILLEA3 clicked');
    
    var button = button;
    var course = course;
    var courseId = course;
    var user = user;
    var version = version;
    var thisuser = MM.db.get("users", MM.config.current_site.id + "-" + user);
    
    
    var users = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var usergrille = users[0].toJSON();
    var grille = usergrille.grille;
    var pifs = usergrille.pif;
    MM.log('User:'+users[0]+'/UserGrille:'+usergrille+'/Grille:'+grille+'/Pif:'+pifs);
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == course;
    });
    
    if (grille!="[]" && grille!="" && grille.q3 == 2)
        var disabled = 'disabled="disabled"';
    else disabled='';
    
    if (grille=="[]" || grille=="") {
        grille = initGrille(thisuser);
    }
    
    var highlight = ' style="background-color:#ff0000"';
    var style="";
    
    var html = '<div id="pifContent" style="overflow-y:hidden">';
    html += '<h1 align="center" class="grille">Evaluation des compétences <span class="red">en amont</span> de la formation</h1>';
    html += '<h1 align="center" class="grille">Grille de positionnement <span class="red">Parties Communes</span></h1>';
    
    html += '<div id="firstcolumngrille">';
    html += '<div id="firstblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo" style="border:0px;background-color:#fff">';
    html+='<tr style="border:0px;background-color:#fff;"><td style="width:50%;border:0px">&nbsp;</td><td style="width:16%;border:0px"><strong>Non fait</strong></td><td style="width:16%;border:0px"><strong>Partiellement fait</strong></td><td style="border:0px;width:16%"><strong>Fait</strong></td></tr>';
    html+='</table>';
    html+='</div>';
    
    html += '<div id="secondblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
    html+= '<tr><td colspan="4"></td></tr>';
    //QUESTION Q1AM
    if (grille.q3 == 1 && grille.q1am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">1/10. L\'agent identifie les attentes des clients</td>';
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1am" value="0" '+disabled;
    if (grille.q1am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1am" value="1" '+disabled;
    if (grille.q1am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1am" value="2" '+disabled;
    if (grille.q1am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q2AM
    if (grille.q3 == 1 && grille.q2am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">2/10. L\'agent applique les règles de communication</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2am" value="0" '+disabled;
    if (grille.q2am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2am" value="1" '+disabled;
    if (grille.q2am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2am" value="2" '+disabled;
    if (grille.q2am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q3AM
    if (grille.q3 == 1 && grille.q3am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">3/10. L\'agent traite les demandes et les réclamations</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3am" value="0" '+disabled;
    if (grille.q3am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3am" value="1" '+disabled;
    if (grille.q3am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3am" value="2" '+disabled;
    if (grille.q3am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q4AM
    if (grille.q3 == 1 && grille.q4am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">4/10. L\'agent nomme les éléments à nettoyer</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4am" value="0" '+disabled;
    if (grille.q4am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4am" value="1" '+disabled;
    if (grille.q4am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4am" value="2" '+disabled;
    if (grille.q4am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q11AM
    if (grille.q3 == 1 && grille.q16am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">5/10. L\'agent utilise le matériel et les produits de nettoyage</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q16am" value="0" '+disabled;
    if (grille.q16am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q16am" value="1" '+disabled;
    if (grille.q16am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q16am" value="2" '+disabled;
    if (grille.q16am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q12AM
    if (grille.q3 == 1 && grille.q17am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">6/10. L\'agent applique les protocoles de nettoyage</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17am" value="0" '+disabled;
    if (grille.q17am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17am" value="1" '+disabled;
    if (grille.q17am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17am" value="2" '+disabled;
    if (grille.q17am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q13AM
    if (grille.q3 == 1 && grille.q18am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">7/10. L\'agent applique les règles d\'hygiène et de sécurité</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18am" value="0" '+disabled;
    if (grille.q18am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18am" value="1" '+disabled;
    if (grille.q18am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18am" value="2" '+disabled;
    if (grille.q18am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q14AM
    if (grille.q3 == 1 && grille.q19am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">8/10. L\'agent applique les attitudes de services</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19am" value="0" '+disabled;
    if (grille.q19am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19am" value="1" '+disabled;
    if (grille.q19am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19am" value="2" '+disabled;
    if (grille.q19am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q15AM
    if (grille.q3 == 1 && grille.q20am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">9/10. L\'agent adopte les bonnes postures de travail</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q20am" value="0" '+disabled;
    if (grille.q20am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q20am" value="1" '+disabled;
    if (grille.q20am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q20am" value="2" '+disabled;
    if (grille.q20am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q10AM
    if (grille.q3 == 1 && grille.q10am == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">10/10. L\'agent travaille en objectif de résultats</td>';
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10am" value="0" '+disabled;
    if (grille.q10am == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10am" value="1" '+disabled;
    if (grille.q10am == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10am" value="2" '+disabled;
    if (grille.q10am == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    html+='</table>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    var options2 = {
            title: 'Stagiaire : '+usergrille.fullname,
            width: "98%",
            marginTop: "5%",
            buttons: {}
        };
    
    //Grille 1 Validée
    if (grille!="[]" && grille!="" && grille.q3 == 2){
        
        options2.buttons["Fermer"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            amont(button,user,course,version);
        };
        options2.buttons["Fermer"]["style"] = "modal-button-8";
        
    } else {
        
        
        
        options2.buttons["Annuler"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            amont(button,user,course,version);
        };
        options2.buttons["Annuler"]["style"] = "modal-button-8";
        
        options2.buttons["Enregistrer"] = function() {
            
            MM.log('Enregistrer Grille 1A');
            if (grille=="") {
                grille={};
            }
            grille.q1am = $('input[name=q1am]:checked').val() ? $('input[name=q1am]:checked').val() : -1;
            grille.q2am = $('input[name=q2am]:checked').val() ? $('input[name=q2am]:checked').val() : -1;
            grille.q3am = $('input[name=q3am]:checked').val() ? $('input[name=q3am]:checked').val() : -1;
            grille.q4am = $('input[name=q4am]:checked').val() ? $('input[name=q4am]:checked').val() : -1;
            grille.q16am = $('input[name=q16am]:checked').val() ? $('input[name=q16am]:checked').val() : -1;
            grille.q17am = $('input[name=q17am]:checked').val() ? $('input[name=q17am]:checked').val() : -1;
            grille.q18am = $('input[name=q18am]:checked').val() ? $('input[name=q18am]:checked').val() : -1;
            grille.q19am = $('input[name=q19am]:checked').val() ? $('input[name=q19am]:checked').val() : -1;
            grille.q20am = $('input[name=q20am]:checked').val() ? $('input[name=q20am]:checked').val() : -1;
            grille.q10am = $('input[name=q10am]:checked').val() ? $('input[name=q10am]:checked').val() : -1;
            grille.q3 = 1;
            
            MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
            
            thisuser.save({grille:grille});
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            amont(button,user,course,version);
            
        };
        options2.buttons["Enregistrer"]["style"] = "modal-button-6";
        
        options2.buttons["Valider la grille"] = function() {
            
            MM.log('Valider Grille 3A');
            
            if(!$('input[name=q1am]').is(':checked') || !$('input[name=q2am]').is(':checked') || !$('input[name=q3am]').is(':checked') || !$('input[name=q4am]').is(':checked') || !$('input[name=q16am]').is(':checked') || !$('input[name=q17am]').is(':checked') || !$('input[name=q18am]').is(':checked') || !$('input[name=q19am]').is(':checked') || !$('input[name=q20am]').is(':checked') || !$('input[name=q10am]').is(':checked')) {
            //if (!tested) {    
                MM.log('Grille Incomplete');
                
                var options3= {
                    title: '',
                    buttons: {}
                };
                
                options3.buttons["Fermer"] = function() {
                    MM.widgets.dialogClose2();
                    grille.q1am = $('input[name=q1am]:checked').val() ? $('input[name=q1am]:checked').val() : -1;
                    grille.q2am = $('input[name=q2am]:checked').val() ? $('input[name=q2am]:checked').val() : -1;
                    grille.q3am = $('input[name=q3am]:checked').val() ? $('input[name=q3am]:checked').val() : -1;
                    grille.q4am = $('input[name=q4am]:checked').val() ? $('input[name=q4am]:checked').val() : -1;
                    grille.q16am = $('input[name=q16am]:checked').val() ? $('input[name=q16am]:checked').val() : -1;
                    grille.q17am = $('input[name=q17am]:checked').val() ? $('input[name=q17am]:checked').val() : -1;
                    grille.q18am = $('input[name=q18am]:checked').val() ? $('input[name=q18am]:checked').val() : -1;
                    grille.q19am = $('input[name=q19am]:checked').val() ? $('input[name=q19am]:checked').val() : -1;
                    grille.q20am = $('input[name=q20am]:checked').val() ? $('input[name=q20am]:checked').val() : -1;
                    grille.q10am = $('input[name=q10am]:checked').val() ? $('input[name=q10am]:checked').val() : -1;
                    grille.q3 = 1;
                    
                    MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
                    
                    thisuser.save({grille:grille});
                    MM.Router.navigate("eleves/" + course );
                    MM.widgets.dialogClose();
                    grillea3(button,user,course,version);
                };
                
                var html3 = "Pour valider, veuillez compléter entièrement la grille de positionnement.";
               
                MM.widgets.dialog2(html3, options3);
		document.getElementById("pifContent").style.height = ((window.innerHeight * 70)/100) + "px";
                
            } else {
                
                MM.log('Grille Complete');
                if (grille=="") {
                    grille={};
                }
                
                grille.q1am = $('input[name=q1am]:checked').val();
                grille.q2am = $('input[name=q2am]:checked').val();
                grille.q3am = $('input[name=q3am]:checked').val();
                grille.q4am = $('input[name=q4am]:checked').val();
                grille.q16am = $('input[name=q16am]:checked').val();
                grille.q17am = $('input[name=q17am]:checked').val();
                grille.q18am = $('input[name=q18am]:checked').val();
                grille.q19am = $('input[name=q19am]:checked').val();
                grille.q20am = $('input[name=q20am]:checked').val();
                grille.q10am = $('input[name=q10am]:checked').val();
                grille.q3 = 2;
                
                MM.log('Grille:'+grille+'/'+grille.q1);
                
                var options4= {
                    title: '',
                    buttons: {}
                };
                options4.buttons["Annuler"] = function() {
                    MM.widgets.dialogClose2();
                };
                
                options4.buttons["Je valide"] = function() {
                    MM.log('Enregistrer et Valider Grille 1A');
                    thisuser.save({grille:grille});
                    //$('button#creerpif[user="'+user+'"]').replaceWith('<button onclick="clickPif($(this),$(this).attr(\'course\'),$(this).attr(\'user\'),$(this).attr(\'version\'),$(this).attr(\'pif\'))" class="btn grd-grisfonce text-blanc" id="pif" pif="" course="'+course+'" version="1" user="'+user+'" path="" module="" class="btn grd-grisfonce text-rouge">PIF</button>');
                    //$('button#creerpif[user="'+user+'"]').unbind('click');
                    //$('button#creerpif[user="'+user+'"]').attr('id','pif');
                    //$('button#pif[user="'+user+'"]').html('PIF');
                    //$('button#pif[user="'+user+'"]').attr('class','btn grd-grisfonce text-blanc');
                    
                    MM.Router.navigate("eleves/" + course, {trigger: true} );
                    
                    MM.widgets.dialogClose2();
                    MM.widgets.dialogClose();
                    amont($('button#pif[user="'+user+'"]'),user,course,version);
                    
                };
                
                var html4 = "En validant la grille, vous mettrez à jour le Protocole de Formation (PIF) de votre stagiaire.<br/>Vos réponses ne pourront plus être modifiées.";
               
                MM.widgets.dialog2(html4, options4);
                document.getElementById("pifContent").style.height = ((window.innerHeight * 70)/100) + "px";
                
                
                
            }
            
        };
        options2.buttons["Valider la grille"]["style"] = "modal-button-7";
    }
    
    $("#app-dialog").addClass('full-screen-dialog2');
    $("#app-dialog .modalContent").css('height','85vh');
    MM.widgets.dialog(html, options2);
    //document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
    document.getElementById("pifContent").style.height = (window.innerHeight - 134) + "px";
    document.getElementById("pifContent").style.maxHeight = (window.innerHeight - 134) + "px";
    document.getElementById("secondblock").style.height = (window.innerHeight - 284) + "px";
}




//Grille A4             
function grillea4(button,user,course,version) {
    
    MM.log('GRILLEA4 clicked');
    
    var button = button;
    var course = course;
    var courseId = course;
    var user = user;
    var version = version;
    var thisuser = MM.db.get("users", MM.config.current_site.id + "-" + user);
    
    
    var users = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var usergrille = users[0].toJSON();
    var grille = usergrille.grille;
    var pifs = usergrille.pif;
    MM.log('User:'+users[0]+'/UserGrille:'+usergrille+'/Grille:'+grille+'/Pif:'+pifs);
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == course;
    });
    
    if (grille!="[]" && grille!="" && grille.q4 == 2)
        var disabled = 'disabled="disabled"';
    else disabled='';
    
    var highlight = ' style="background-color:#ff0000"';
    var style="";
    
    var html = '<div id="pifContent" style="overflow-y:hidden">';
    html += '<h1 align="center" class="grille">Evaluation des compétences <span class="red">en aval</span> de la formation</h1>';
    html += '<h1 align="center" class="grille">Grille de positionnement <span class="red">Bureaux</span></h1>';
    
    html += '<div id="firstcolumngrille">';
    html += '<div id="firstblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo" style="border:0px;background-color:#fff">';
    html+='<tr style="border:0px;background-color:#fff;"><td style="width:50%;border:0px">&nbsp;</td><td style="width:16%;border:0px"><strong>Non fait</strong></td><td style="width:16%;border:0px"><strong>Partiellement fait</strong></td><td style="border:0px;width:16%"><strong>Fait</strong></td></tr>';
    html+='</table>';
    html+='</div>';
    
    html += '<div id="secondblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
    html+= '<tr><td colspan="4"></td></tr>';
    //QUESTION Q1AV
    html+='<tr id="title" opened="1">';
    html+='<td colspan="5">L\'agent identifie les attentes des clients</td>';
    html+='</tr>';
    
    if (grille.q1av == 3 || grille.q1av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q1av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">L\'hotesse d\'accueil</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="3" '+disabled;
    if (grille.q1av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="0" '+disabled;
    if (grille.q1av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="1" '+disabled;
    if (grille.q1av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="2" '+disabled;
    if (grille.q1av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q2AV
    if (grille.q2av == 3 || grille.q2av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q2av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le salarié de l\'entreprise client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="3" '+disabled;
    if (grille.q2av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="0" '+disabled;
    if (grille.q2av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="1" '+disabled;
    if (grille.q2av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="2" '+disabled;
    if (grille.q2av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q3AV
    if (grille.q3av == 3 || grille.q3av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q3av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le responsable de la propreté</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="3" '+disabled;
    if (grille.q3av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="0" '+disabled;
    if (grille.q3av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="1" '+disabled;
    if (grille.q3av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="2" '+disabled;
    if (grille.q3av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q4AV
    if (grille.q4av == 3 || grille.q4av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q4av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le directeur</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="3" '+disabled;
    if (grille.q4av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="0" '+disabled;
    if (grille.q4av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="1" '+disabled;
    if (grille.q4av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="2" '+disabled;
    if (grille.q4av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q5AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les règles de communication</td>';
    html+='</tr>';
    
    if (grille.q5av == 3 || grille.q5av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q5av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">L\'attitude professionnelle</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="3" '+disabled;
    if (grille.q5av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="0" '+disabled;
    if (grille.q5av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="1" '+disabled;
    if (grille.q5av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="2" '+disabled;
    if (grille.q5av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q6AV
    if (grille.q6av == 3 || grille.q6av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q6av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'écoute active</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="3" '+disabled;
    if (grille.q6av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="0" '+disabled;
    if (grille.q6av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="1" '+disabled;
    if (grille.q6av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="2" '+disabled;
    if (grille.q6av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q7AV
    if (grille.q7av == 3 || grille.q7av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q7av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La reformulation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="3" '+disabled;
    if (grille.q7av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="0" '+disabled;
    if (grille.q7av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="1" '+disabled;
    if (grille.q7av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="2" '+disabled;
    if (grille.q7av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q8AV
    if (grille.q8av == 3 || grille.q8av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q8av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les types de question</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="3" '+disabled;
    if (grille.q8av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="0" '+disabled;
    if (grille.q8av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="1" '+disabled;
    if (grille.q8av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="2" '+disabled;
    if (grille.q8av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q9AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent traite les demandes et les réclamations</td>';
    html+='</tr>';
    
    if (grille.q9av == 3 || grille.q9av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q9av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Le traitement des demandes client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="3" '+disabled;
    if (grille.q9av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="0" '+disabled;
    if (grille.q9av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="1" '+disabled;
    if (grille.q9av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="2" '+disabled;
    if (grille.q9av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q10AV
    if (grille.q10av == 3 || grille.q10av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q10av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le traitement des réclamations</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="3" '+disabled;
    if (grille.q10av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="0" '+disabled;
    if (grille.q10av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="1" '+disabled;
    if (grille.q10av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="2" '+disabled;
    if (grille.q10av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q11AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent nomme les éléments à nettoyer</td>';
    html+='</tr>';
    
    if (grille.q11av == 3 || grille.q11av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q11av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Le bureau</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="3" '+disabled;
    if (grille.q11av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="0" '+disabled;
    if (grille.q11av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="1" '+disabled;
    if (grille.q11av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="2" '+disabled;
    if (grille.q11av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q12AV
    if (grille.q12av == 3 || grille.q12av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q12av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le sanitaire</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="3" '+disabled;
    if (grille.q12av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="0" '+disabled;
    if (grille.q12av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="1" '+disabled;
    if (grille.q12av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="2" '+disabled;
    if (grille.q12av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q13AV
    if (grille.q13av == 3 || grille.q13av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q13av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'ascenseur</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="3" '+disabled;
    if (grille.q13av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="0" '+disabled;
    if (grille.q13av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="1" '+disabled;
    if (grille.q13av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="2" '+disabled;
    if (grille.q13av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q14AV
    if (grille.q14av == 3 || grille.q14av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q14av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'escalier</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="3" '+disabled;
    if (grille.q14av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="0" '+disabled;
    if (grille.q14av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="1" '+disabled;
    if (grille.q14av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="2" '+disabled;
    if (grille.q14av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q15AV
    if (grille.q15av == 3 || grille.q15av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q15av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le hall d\'entrée</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="3" '+disabled;
    if (grille.q15av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="0" '+disabled;
    if (grille.q15av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="1" '+disabled;
    if (grille.q15av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="2" '+disabled;
    if (grille.q15av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q16AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent utilise le matériel et les produits de nettoyage</td>';
    html+='</tr>';
    
    if (grille.q16av == 3 || grille.q16av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q16av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">La désignation des organes de l\'aspirateur à poussières</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="3" '+disabled;
    if (grille.q16av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="0" '+disabled;
    if (grille.q16av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="1" '+disabled;
    if (grille.q16av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="2" '+disabled;
    if (grille.q16av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q17AV
    if (grille.q17av == 3 || grille.q17av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q17av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'entretien de l\'aspirateur à poussières</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="3" '+disabled;
    if (grille.q17av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="0" '+disabled;
    if (grille.q17av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="1" '+disabled;
    if (grille.q17av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="2" '+disabled;
    if (grille.q17av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q18AV
    if (grille.q18av == 3 || grille.q18av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q18av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La désignation du matériel de nettoyage</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="3" '+disabled;
    if (grille.q18av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="0" '+disabled;
    if (grille.q18av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="1" '+disabled;
    if (grille.q18av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="2" '+disabled;
    if (grille.q18av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q19AV
    if (grille.q19av == 3 || grille.q19av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q19av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'utilsation des produits de nettoyage</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="3" '+disabled;
    if (grille.q19av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="0" '+disabled;
    if (grille.q19av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="1" '+disabled;
    if (grille.q19av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="2" '+disabled;
    if (grille.q19av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q20AV
    if (grille.q20av == 3 || grille.q20av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q20av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le matériel et les produits adaptés aux travaux effectués</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q20av" value="3" '+disabled;
    if (grille.q20av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q20av" value="0" '+disabled;
    if (grille.q20av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q20av" value="1" '+disabled;
    if (grille.q20av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q20av" value="2" '+disabled;
    if (grille.q20av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q21AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les protocoles de nettoyage</td>';
    html+='</tr>';
    
    if (grille.q21av == 3 || grille.q21av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q21av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Les règles de tri des déchets</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="3" '+disabled;
    if (grille.q21av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="0" '+disabled;
    if (grille.q21av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="1" '+disabled;
    if (grille.q21av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="2" '+disabled;
    if (grille.q21av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q22AV
    if (grille.q22av == 3 || grille.q22av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q22av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique d\'essuyage humide</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="3" '+disabled;
    if (grille.q22av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="0" '+disabled;
    if (grille.q22av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="1" '+disabled;
    if (grille.q22av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="2" '+disabled;
    if (grille.q22av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q23AV
    if (grille.q23av == 3 || grille.q23av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q23av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique de balayage humide</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="3" '+disabled;
    if (grille.q23av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="0" '+disabled;
    if (grille.q23av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="1" '+disabled;
    if (grille.q23av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="2" '+disabled;
    if (grille.q23av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q24AV
    if (grille.q24av == 3 || grille.q24av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q24av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique d\'aspiration des sols</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="3" '+disabled;
    if (grille.q24av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="0" '+disabled;
    if (grille.q24av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="1" '+disabled;
    if (grille.q24av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="2" '+disabled;
    if (grille.q24av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q25AV
    if (grille.q25av == 3 || grille.q25av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q25av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique de lavage manuel</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="3" '+disabled;
    if (grille.q25av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="0" '+disabled;
    if (grille.q25av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="1" '+disabled;
    if (grille.q25av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="2" '+disabled;
    if (grille.q25av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q26AV
    if (grille.q26av == 3 || grille.q26av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q26av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Elimination des déchets</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q26av" value="3" '+disabled;
    if (grille.q26av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q26av" value="0" '+disabled;
    if (grille.q26av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q26av" value="1" '+disabled;
    if (grille.q26av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q26av" value="2" '+disabled;
    if (grille.q26av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q27AV
    if (grille.q27av == 3 || grille.q27av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q27av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Essuyage du mobilier</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q27av" value="3" '+disabled;
    if (grille.q27av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q27av" value="0" '+disabled;
    if (grille.q27av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q27av" value="1" '+disabled;
    if (grille.q27av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q27av" value="2" '+disabled;
    if (grille.q27av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q28AV
    if (grille.q28av == 3 || grille.q28av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q28av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Désinfection des points de contact</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q28av" value="3" '+disabled;
    if (grille.q28av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q28av" value="0" '+disabled;
    if (grille.q28av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q28av" value="1" '+disabled;
    if (grille.q28av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q28av" value="2" '+disabled;
    if (grille.q28av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q29AV
    if (grille.q29av == 3 || grille.q29av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q29av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Aspiration du sol</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q29av" value="3" '+disabled;
    if (grille.q29av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q29av" value="0" '+disabled;
    if (grille.q29av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q29av" value="1" '+disabled;
    if (grille.q29av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q29av" value="2" '+disabled;
    if (grille.q29av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q30AV
    if (grille.q30av == 3 || grille.q30av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q30av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Contrôle du résultat</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q30av" value="3" '+disabled;
    if (grille.q30av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q30av" value="0" '+disabled;
    if (grille.q30av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q30av" value="1" '+disabled;
    if (grille.q30av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q30av" value="2" '+disabled;
    if (grille.q30av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q31AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les règles d\'hygiène et de sécurité</td>';
    html+='</tr>';
    
    if (grille.q31av == 3 || grille.q31av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q31av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Les risques de glissade</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="3" '+disabled;
    if (grille.q31av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="0" '+disabled;
    if (grille.q31av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="1" '+disabled;
    if (grille.q31av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="2" '+disabled;
    if (grille.q31av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q32AV
    if (grille.q32av == 3 || grille.q32av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    
    if (grille.q4 == 1 && grille.q32av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les risques chimiques</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="3" '+disabled;
    if (grille.q32av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="0" '+disabled;
    if (grille.q32av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="1" '+disabled;
    if (grille.q32av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="2" '+disabled;
    if (grille.q32av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q33AV
    if (grille.q33av == 3 || grille.q33av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    
    if (grille.q4 == 1 && grille.q33av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les risques électriques</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="3" '+disabled;
    if (grille.q33av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="0" '+disabled;
    if (grille.q33av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="1" '+disabled;
    if (grille.q33av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="2" '+disabled;
    if (grille.q33av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q34AV
    if (grille.q34av == 3 || grille.q34av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    
    if (grille.q4 == 1 && grille.q34av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les risques de chute</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="3" '+disabled;
    if (grille.q34av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="0" '+disabled;
    if (grille.q34av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="1" '+disabled;
    if (grille.q34av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="2" '+disabled;
    if (grille.q34av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q35AV
    if (grille.q35av == 3 || grille.q35av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    
    if (grille.q4 == 1 && grille.q35av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les équipements de protection individuelle</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="3" '+disabled;
    if (grille.q35av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="0" '+disabled;
    if (grille.q35av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="1" '+disabled;
    if (grille.q35av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="2" '+disabled;
    if (grille.q35av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q36AV
    if (grille.q36av == 3 || grille.q36av == undefined)
        disabled='';
   else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    
    if (grille.q4 == 1 && grille.q36av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'avertissement</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="3" '+disabled;
    if (grille.q36av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="0" '+disabled;
    if (grille.q36av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="1" '+disabled;
    if (grille.q36av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="2" '+disabled;
    if (grille.q36av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q37AV
    if (grille.q37av == 3 || grille.q37av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    
    if (grille.q4 == 1 && grille.q37av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'interdiction</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="3" '+disabled;
    if (grille.q37av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="0" '+disabled;
    if (grille.q37av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="1" '+disabled;
    if (grille.q37av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="2" '+disabled;
    if (grille.q37av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q38AV
    if (grille.q38av == 3 || grille.q38av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    
    if (grille.q4 == 1 && grille.q38av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'obligation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="3" '+disabled;
    if (grille.q38av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="0" '+disabled;
    if (grille.q38av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="1" '+disabled;
    if (grille.q38av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="2" '+disabled;
    if (grille.q38av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q39AV
    if (grille.q39av == 3 || grille.q39av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q39av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'évacuation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="3" '+disabled;
    if (grille.q39av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="0" '+disabled;
    if (grille.q39av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="1" '+disabled;
    if (grille.q39av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="2" '+disabled;
    if (grille.q39av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q40AV
    if (grille.q40av == 3 || grille.q40av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    
    if (grille.q4 == 1 && grille.q40av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux de lutte contre l\'incendie</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="3" '+disabled;
    if (grille.q40av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="0" '+disabled;
    if (grille.q40av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="1" '+disabled;
    if (grille.q40av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="2" '+disabled;
    if (grille.q40av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q41AV
    if (grille.q41av == 3 || grille.q41av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    
    if (grille.q4 == 1 && grille.q41av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les principes de l\'hygiène</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="3" '+disabled;
    if (grille.q41av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="0" '+disabled;
    if (grille.q41av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="1" '+disabled;
    if (grille.q41av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="2" '+disabled;
    if (grille.q41av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q42AV
    if (grille.q42av == 3 || grille.q42av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q42av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'élimination des microbes</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="3" '+disabled;
    if (grille.q42av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="0" '+disabled;
    if (grille.q42av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="1" '+disabled;
    if (grille.q42av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="2" '+disabled;
    if (grille.q42av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q43AV
    if (grille.q43av == 3 || grille.q43av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    
    if (grille.q4 == 1 && grille.q43av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les soins du corps</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="3" '+disabled;
    if (grille.q43av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="0" '+disabled;
    if (grille.q43av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="1" '+disabled;
    if (grille.q43av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="2" '+disabled;
    if (grille.q43av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q44AV
    if (grille.q44av == 3 || grille.q44av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q44av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'hygiène des mains</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="3" '+disabled;
    if (grille.q44av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="0" '+disabled;
    if (grille.q44av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="1" '+disabled;
    if (grille.q44av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="2" '+disabled;
    if (grille.q44av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q45AV
    if (grille.q45av == 3 || grille.q45av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q45av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les travaux en hauteur</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q45av" value="3" '+disabled;
    if (grille.q45av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q45av" value="0" '+disabled;
    if (grille.q45av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q45av" value="1" '+disabled;
    if (grille.q45av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q45av" value="2" '+disabled;
    if (grille.q45av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q46AV
    if (grille.q46av == 3 || grille.q46av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q46av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le trasmport des déchets</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q46av" value="3" '+disabled;
    if (grille.q46av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q46av" value="0" '+disabled;
    if (grille.q46av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q46av" value="1" '+disabled;
    if (grille.q46av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q46av" value="2" '+disabled;
    if (grille.q46av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q47AV
    if (grille.q47av == 3 || grille.q47av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q47av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les règles de sécurité appliquées aux travaux effectués</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q47av" value="3" '+disabled;
    if (grille.q47av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q47av" value="0" '+disabled;
    if (grille.q47av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q47av" value="1" '+disabled;
    if (grille.q47av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q47av" value="2" '+disabled;
    if (grille.q47av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q48AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les attitudes de services</td>';
    html+='</tr>';
    
    if (grille.q48av == 3 || grille.q48av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q48av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Les règles de politesse</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="3" '+disabled;
    if (grille.q48av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="0" '+disabled;
    if (grille.q48av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="1" '+disabled;
    if (grille.q48av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="2" '+disabled;
    if (grille.q48av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q49AV
    if (grille.q49av == 3 || grille.q49av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q49av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les règles de confidentialité</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="3" '+disabled;
    if (grille.q49av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="0" '+disabled;
    if (grille.q49av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="1" '+disabled;
    if (grille.q49av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="2" '+disabled;
    if (grille.q49av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q50AV
    if (grille.q50av == 3 || grille.q50av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q50av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le sens du service</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="3" '+disabled;
    if (grille.q50av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="0" '+disabled;
    if (grille.q50av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="1" '+disabled;
    if (grille.q50av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="2" '+disabled;
    if (grille.q50av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q51AV
    if (grille.q51av == 3 || grille.q51av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q51av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le comportement sur un site client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="3" '+disabled;
    if (grille.q51av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="0" '+disabled;
    if (grille.q51av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="1" '+disabled;
    if (grille.q51av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="2" '+disabled;
    if (grille.q51av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q52AV
    if (grille.q52av == 3 || grille.q52av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q52av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les demandes du client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q52av" value="3" '+disabled;
    if (grille.q52av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q52av" value="0" '+disabled;
    if (grille.q52av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q52av" value="1" '+disabled;
    if (grille.q52av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q52av" value="2" '+disabled;
    if (grille.q52av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q53AV
    if (grille.q53av == 3 || grille.q53av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q53av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'utilisation des installations du client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q53av" value="3" '+disabled;
    if (grille.q53av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q53av" value="0" '+disabled;
    if (grille.q53av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q53av" value="1" '+disabled;
    if (grille.q53av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q53av" value="2" '+disabled;
    if (grille.q53av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q54AV
    if (grille.q54av == 3 || grille.q54av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q54av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les règles de discrétion</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q54av" value="3" '+disabled;
    if (grille.q54av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q54av" value="0" '+disabled;
    if (grille.q54av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q54av" value="1" '+disabled;
    if (grille.q54av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q54av" value="2" '+disabled;
    if (grille.q54av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q55AV
    if (grille.q55av == 3 || grille.q55av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q55av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les habitudes du client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q55av" value="3" '+disabled;
    if (grille.q55av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q55av" value="0" '+disabled;
    if (grille.q55av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q55av" value="1" '+disabled;
    if (grille.q55av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q55av" value="2" '+disabled;
    if (grille.q55av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q56AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent adopte les bonnes postures de travail</td>';
    html+='</tr>';
    
    if (grille.q56av == 3 || grille.q56av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q56av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Soulever une charge</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="3" '+disabled;
    if (grille.q56av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="0" '+disabled;
    if (grille.q56av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="1" '+disabled;
    if (grille.q56av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="2" '+disabled;
    if (grille.q56av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q57AV
    if (grille.q57av == 3 || grille.q57av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q57av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Tenir un aspirateurs à poussières</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="3" '+disabled;
    if (grille.q57av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="0" '+disabled;
    if (grille.q57av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="1" '+disabled;
    if (grille.q57av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="2" '+disabled;
    if (grille.q57av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q58AV
    if (grille.q58av == 3 || grille.q58av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q58av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Fixer une gaze sur un balai</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="3" '+disabled;
    if (grille.q58av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q58av" value="0" '+disabled;
    if (grille.q58av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q58av" value="1" '+disabled;
    if (grille.q58av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q58av" value="2" '+disabled;
    if (grille.q58av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q59AV
    if (grille.q59av == 3 || grille.q59av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q59av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les postures adaptées aux opérations effectuées</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q59av" value="3" '+disabled;
    if (grille.q59av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q59av" value="0" '+disabled;
    if (grille.q59av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q59av" value="1" '+disabled;
    if (grille.q59av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q59av" value="2" '+disabled;
    if (grille.q59av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q60AV
    if (grille.q60av == 3 || grille.q60av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent travaille en objectif de résultats</td>';
    html+='</tr>';
    
    if (grille.q4 == 1 && grille.q60av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">La qualité de service</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="3" '+disabled;
    if (grille.q60av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="0" '+disabled;
    if (grille.q60av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="1" '+disabled;
    if (grille.q60av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="2" '+disabled;
    if (grille.q60av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';

    //QUESTION Q61AV
    if (grille.q61av == 3 || grille.q61av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q61av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les missions qualité des acteurs de l\'entreprise</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="3" '+disabled;
    if (grille.q61av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="0" '+disabled;
    if (grille.q61av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="1" '+disabled;
    if (grille.q61av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="2" '+disabled;
    if (grille.q61av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q62AV
    if (grille.q62av == 3 || grille.q62av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q62av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les résultats attendus des opérations de nettoyage</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="3" '+disabled;
    if (grille.q62av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="0" '+disabled;
    if (grille.q62av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="1" '+disabled;
    if (grille.q62av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="2" '+disabled;
    if (grille.q62av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q63AV
    if (grille.q63av == 3 || grille.q63av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q63av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La démarche qualité appliquée à son travail</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="3" '+disabled;
    if (grille.q63av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="0" '+disabled;
    if (grille.q63av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="1" '+disabled;
    if (grille.q63av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="2" '+disabled;
    if (grille.q63av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q64AV
    if (grille.q64av == 3 || grille.q64av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q64av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La traçabilité des opérations effectuées</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="3" '+disabled;
    if (grille.q64av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="0" '+disabled;
    if (grille.q64av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="1" '+disabled;
    if (grille.q64av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="2" '+disabled;
    if (grille.q64av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q65AV
    if (grille.q65av == 3 || grille.q65av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q4 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q4 == 1 && grille.q65av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les actions de contrôle en fin de prestation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q65av" value="3" '+disabled;
    if (grille.q65av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q65av" value="0" '+disabled;
    if (grille.q65av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q65av" value="1" '+disabled;
    if (grille.q65av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q65av" value="2" '+disabled;
    if (grille.q65av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    html+='</table>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    
    
    
    var options2 = {
            title: 'Stagiaire : '+usergrille.fullname,
            width: "98%",
            marginTop: "5%",
            buttons: {}
        };
    
    //Grille 1 Validée
    if (grille!="[]" && grille!="" && grille.q4 == 2){
        
        options2.buttons["Fermer"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            aval(button,user,course,version);
        };
        options2.buttons["Fermer"]["style"] = "modal-button-8";
        
    } else {
        
        
        
        options2.buttons["Annuler"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            aval(button,user,course,version);
        };
        options2.buttons["Annuler"]["style"] = "modal-button-8";
        
        options2.buttons["Enregistrer"] = function() {
            
            MM.log('Enregistrer Grille 1A');
            if (grille=="") {
                grille={};
            }
            grille.q1av = $('input[name=q1av]:checked').val() ? $('input[name=q1av]:checked').val() : -1;
            grille.q2av = $('input[name=q2av]:checked').val() ? $('input[name=q2av]:checked').val() : -1;
            grille.q3av = $('input[name=q3av]:checked').val() ? $('input[name=q3av]:checked').val() : -1;
            grille.q4av = $('input[name=q4av]:checked').val() ? $('input[name=q4av]:checked').val() : -1;
            grille.q5av = $('input[name=q5av]:checked').val() ? $('input[name=q5av]:checked').val() : -1;
            grille.q6av = $('input[name=q6av]:checked').val() ? $('input[name=q6av]:checked').val() : -1;
            grille.q7av = $('input[name=q7av]:checked').val() ? $('input[name=q7av]:checked').val() : -1;
            grille.q8av = $('input[name=q8av]:checked').val() ? $('input[name=q8av]:checked').val() : -1;
            grille.q9av = $('input[name=q9av]:checked').val() ? $('input[name=q9av]:checked').val() : -1;
            grille.q10av = $('input[name=q10av]:checked').val() ? $('input[name=q10av]:checked').val() : -1;
            grille.q11av = $('input[name=q11av]:checked').val() ? $('input[name=q11av]:checked').val() : -1;
            grille.q12av = $('input[name=q12av]:checked').val() ? $('input[name=q12av]:checked').val() : -1;
            grille.q13av = $('input[name=q13av]:checked').val() ? $('input[name=q13av]:checked').val() : -1;
            grille.q14av = $('input[name=q14av]:checked').val() ? $('input[name=q14av]:checked').val() : -1;
            grille.q15av = $('input[name=q15av]:checked').val() ? $('input[name=q15av]:checked').val() : -1;
            grille.q16av = $('input[name=q16av]:checked').val() ? $('input[name=q16av]:checked').val() : -1;
            grille.q17av = $('input[name=q17av]:checked').val() ? $('input[name=q17av]:checked').val() : -1;
            grille.q18av = $('input[name=q18av]:checked').val() ? $('input[name=q18av]:checked').val() : -1;
            grille.q19av = $('input[name=q19av]:checked').val() ? $('input[name=q19av]:checked').val() : -1;
            grille.q20av = $('input[name=q20av]:checked').val() ? $('input[name=q20av]:checked').val() : -1;
            grille.q21av = $('input[name=q21av]:checked').val() ? $('input[name=q21av]:checked').val() : -1;
            grille.q22av = $('input[name=q22av]:checked').val() ? $('input[name=q22av]:checked').val() : -1;
            grille.q23av = $('input[name=q23av]:checked').val() ? $('input[name=q23av]:checked').val() : -1;
            grille.q24av = $('input[name=q24av]:checked').val() ? $('input[name=q24av]:checked').val() : -1;
            grille.q25av = $('input[name=q25av]:checked').val() ? $('input[name=q25av]:checked').val() : -1;
            grille.q26av = $('input[name=q26av]:checked').val() ? $('input[name=q26av]:checked').val() : -1;
            grille.q27av = $('input[name=q27av]:checked').val() ? $('input[name=q27av]:checked').val() : -1;
            grille.q28av = $('input[name=q28av]:checked').val() ? $('input[name=q28av]:checked').val() : -1;
            grille.q29av = $('input[name=q29av]:checked').val() ? $('input[name=q29av]:checked').val() : -1;
            grille.q30av = $('input[name=q30av]:checked').val() ? $('input[name=q30av]:checked').val() : -1;
            grille.q31av = $('input[name=q31av]:checked').val() ? $('input[name=q31av]:checked').val() : -1;
            grille.q32av = $('input[name=q32av]:checked').val() ? $('input[name=q32av]:checked').val() : -1;
            grille.q33av = $('input[name=q33av]:checked').val() ? $('input[name=q33av]:checked').val() : -1;
            grille.q34av = $('input[name=q34av]:checked').val() ? $('input[name=q34av]:checked').val() : -1;
            grille.q35av = $('input[name=q35av]:checked').val() ? $('input[name=q35av]:checked').val() : -1;
            grille.q36av = $('input[name=q36av]:checked').val() ? $('input[name=q36av]:checked').val() : -1;
            grille.q37av = $('input[name=q37av]:checked').val() ? $('input[name=q37av]:checked').val() : -1;
            grille.q38av = $('input[name=q38av]:checked').val() ? $('input[name=q38av]:checked').val() : -1;
            grille.q39av = $('input[name=q39av]:checked').val() ? $('input[name=q39av]:checked').val() : -1;
            grille.q40av = $('input[name=q40av]:checked').val() ? $('input[name=q40av]:checked').val() : -1;
            grille.q41av = $('input[name=q41av]:checked').val() ? $('input[name=q41av]:checked').val() : -1;
            grille.q42av = $('input[name=q42av]:checked').val() ? $('input[name=q42av]:checked').val() : -1;
            grille.q43av = $('input[name=q43av]:checked').val() ? $('input[name=q43av]:checked').val() : -1;
            grille.q44av = $('input[name=q44av]:checked').val() ? $('input[name=q44av]:checked').val() : -1;
            grille.q45av = $('input[name=q45av]:checked').val() ? $('input[name=q45av]:checked').val() : -1;
            grille.q46av = $('input[name=q46av]:checked').val() ? $('input[name=q46av]:checked').val() : -1;
            grille.q47av = $('input[name=q47av]:checked').val() ? $('input[name=q47av]:checked').val() : -1;
            grille.q48av = $('input[name=q48av]:checked').val() ? $('input[name=q48av]:checked').val() : -1;
            grille.q49av = $('input[name=q49av]:checked').val() ? $('input[name=q49av]:checked').val() : -1;
            grille.q50av = $('input[name=q50av]:checked').val() ? $('input[name=q50av]:checked').val() : -1;
            grille.q51av = $('input[name=q51av]:checked').val() ? $('input[name=q51av]:checked').val() : -1;
            grille.q52av = $('input[name=q52av]:checked').val() ? $('input[name=q52av]:checked').val() : -1;
            grille.q53av = $('input[name=q53av]:checked').val() ? $('input[name=q53av]:checked').val() : -1;
            grille.q54av = $('input[name=q54av]:checked').val() ? $('input[name=q54av]:checked').val() : -1;
            grille.q55av = $('input[name=q55av]:checked').val() ? $('input[name=q55av]:checked').val() : -1;
            grille.q56av = $('input[name=q56av]:checked').val() ? $('input[name=q56av]:checked').val() : -1;
            grille.q57av = $('input[name=q57av]:checked').val() ? $('input[name=q57av]:checked').val() : -1;
            grille.q58av = $('input[name=q58av]:checked').val() ? $('input[name=q58av]:checked').val() : -1;
            grille.q59av = $('input[name=q59av]:checked').val() ? $('input[name=q59av]:checked').val() : -1;
            grille.q60av = $('input[name=q60av]:checked').val() ? $('input[name=q60av]:checked').val() : -1;
            grille.q61av = $('input[name=q61av]:checked').val() ? $('input[name=q61av]:checked').val() : -1;
            grille.q62av = $('input[name=q62av]:checked').val() ? $('input[name=q62av]:checked').val() : -1;
            grille.q63av = $('input[name=q63av]:checked').val() ? $('input[name=q63av]:checked').val() : -1;
            grille.q64av = $('input[name=q64av]:checked').val() ? $('input[name=q64av]:checked').val() : -1;
            grille.q65av = $('input[name=q65av]:checked').val() ? $('input[name=q65av]:checked').val() : -1;
            
            
            grille.q4 = 1;
            
            MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
            
            thisuser.save({grille:grille});
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            aval(button,user,course,version);
            
        };
        options2.buttons["Enregistrer"]["style"] = "modal-button-6";
        
        options2.buttons["Valider la grille"] = function() {
            
            MM.log('Valider Grille 3A');
            
            if(!$('input[name=q1av]').is(':checked')
               || !$('input[name=q2av]').is(':checked')
               || !$('input[name=q3av]').is(':checked')
               || !$('input[name=q4av]').is(':checked')
               || !$('input[name=q5av]').is(':checked')
               || !$('input[name=q6av]').is(':checked')
               || !$('input[name=q7av]').is(':checked')
               || !$('input[name=q8av]').is(':checked')
               || !$('input[name=q9av]').is(':checked')
               || !$('input[name=q10av]').is(':checked')
               || !$('input[name=q11av]').is(':checked')
               || !$('input[name=q12av]').is(':checked')
               || !$('input[name=q13av]').is(':checked')
               || !$('input[name=q14av]').is(':checked')
               || !$('input[name=q15av]').is(':checked')
               || !$('input[name=q16av]').is(':checked')
               || !$('input[name=q17av]').is(':checked')
               || !$('input[name=q18av]').is(':checked')
               || !$('input[name=q19av]').is(':checked')
               || !$('input[name=q20av]').is(':checked')
               || !$('input[name=q11av]').is(':checked')
               || !$('input[name=q12av]').is(':checked')
               || !$('input[name=q13av]').is(':checked')
               || !$('input[name=q14av]').is(':checked')
               || !$('input[name=q15av]').is(':checked')
               || !$('input[name=q16av]').is(':checked')
               || !$('input[name=q17av]').is(':checked')
               || !$('input[name=q18av]').is(':checked')
               || !$('input[name=q19av]').is(':checked')
               || !$('input[name=q20av]').is(':checked')
               || !$('input[name=q21av]').is(':checked')
               || !$('input[name=q22av]').is(':checked')
               || !$('input[name=q23av]').is(':checked')
               || !$('input[name=q24av]').is(':checked')
               || !$('input[name=q25av]').is(':checked')
               || !$('input[name=q26av]').is(':checked')
               || !$('input[name=q27av]').is(':checked')
               || !$('input[name=q28av]').is(':checked')
               || !$('input[name=q29av]').is(':checked')
               || !$('input[name=q30av]').is(':checked')
               || !$('input[name=q31av]').is(':checked')
               || !$('input[name=q32av]').is(':checked')
               || !$('input[name=q33av]').is(':checked')
               || !$('input[name=q34av]').is(':checked')
               || !$('input[name=q35av]').is(':checked')
               || !$('input[name=q36av]').is(':checked')
               || !$('input[name=q37av]').is(':checked')
               || !$('input[name=q38av]').is(':checked')
               || !$('input[name=q39av]').is(':checked')
               || !$('input[name=q40av]').is(':checked')
               || !$('input[name=q41av]').is(':checked')
               || !$('input[name=q42av]').is(':checked')
               || !$('input[name=q43av]').is(':checked')
               || !$('input[name=q44av]').is(':checked')
               || !$('input[name=q45av]').is(':checked')
               || !$('input[name=q46av]').is(':checked')
               || !$('input[name=q47av]').is(':checked')
               || !$('input[name=q48av]').is(':checked')
               || !$('input[name=q49av]').is(':checked')
               || !$('input[name=q50av]').is(':checked')
               || !$('input[name=q51av]').is(':checked')
               || !$('input[name=q52av]').is(':checked')
               || !$('input[name=q53av]').is(':checked')
               || !$('input[name=q54av]').is(':checked')
               || !$('input[name=q55av]').is(':checked')
               || !$('input[name=q56av]').is(':checked')
               || !$('input[name=q57av]').is(':checked')
               || !$('input[name=q58av]').is(':checked')
               || !$('input[name=q59av]').is(':checked')
               || !$('input[name=q60av]').is(':checked')
               || !$('input[name=q61av]').is(':checked')
               || !$('input[name=q62av]').is(':checked')
               || !$('input[name=q63av]').is(':checked')
               || !$('input[name=q64av]').is(':checked')
               || !$('input[name=q65av]').is(':checked')
              ) {
            //if (!tested) {    
                MM.log('Grille Incomplete');
                
                var options3= {
                    title: '',
                    buttons: {}
                };
                
                options3.buttons["Fermer"] = function() {
                    grille.q1av = $('input[name=q2av]:checked').val() ? $('input[name=q1av]:checked').val() : -1;
                    grille.q2av = $('input[name=q2av]:checked').val() ? $('input[name=q2av]:checked').val() : -1;
                    grille.q3av = $('input[name=q3av]:checked').val() ? $('input[name=q3av]:checked').val() : -1;
                    grille.q4av = $('input[name=q4av]:checked').val() ? $('input[name=q4av]:checked').val() : -1;
                    grille.q5av = $('input[name=q5av]:checked').val() ? $('input[name=q5av]:checked').val() : -1;
                    grille.q6av = $('input[name=q6av]:checked').val() ? $('input[name=q6av]:checked').val() : -1;
                    grille.q7av = $('input[name=q7av]:checked').val() ? $('input[name=q7av]:checked').val() : -1;
                    grille.q8av = $('input[name=q8av]:checked').val() ? $('input[name=q8av]:checked').val() : -1;
                    grille.q9av = $('input[name=q9av]:checked').val() ? $('input[name=q9av]:checked').val() : -1;
                    grille.q10av = $('input[name=q10av]:checked').val() ? $('input[name=q10av]:checked').val() : -1;
                    grille.q11av = $('input[name=q11av]:checked').val() ? $('input[name=q11av]:checked').val() : -1;
                    grille.q12av = $('input[name=q12av]:checked').val() ? $('input[name=q12av]:checked').val() : -1;
                    grille.q13av = $('input[name=q13av]:checked').val() ? $('input[name=q13av]:checked').val() : -1;
                    grille.q14av = $('input[name=q14av]:checked').val() ? $('input[name=q14av]:checked').val() : -1;
                    grille.q15av = $('input[name=q15av]:checked').val() ? $('input[name=q15av]:checked').val() : -1;
                    grille.q16av = $('input[name=q16av]:checked').val() ? $('input[name=q16av]:checked').val() : -1;
                    grille.q17av = $('input[name=q17av]:checked').val() ? $('input[name=q17av]:checked').val() : -1;
                    grille.q18av = $('input[name=q18av]:checked').val() ? $('input[name=q18av]:checked').val() : -1;
                    grille.q19av = $('input[name=q19av]:checked').val() ? $('input[name=q19av]:checked').val() : -1;
                    grille.q20av = $('input[name=q20av]:checked').val() ? $('input[name=q20av]:checked').val() : -1;
                    grille.q21av = $('input[name=q21av]:checked').val() ? $('input[name=q21av]:checked').val() : -1;
                    grille.q22av = $('input[name=q22av]:checked').val() ? $('input[name=q22av]:checked').val() : -1;
                    grille.q23av = $('input[name=q23av]:checked').val() ? $('input[name=q23av]:checked').val() : -1;
                    grille.q24av = $('input[name=q24av]:checked').val() ? $('input[name=q24av]:checked').val() : -1;
                    grille.q25av = $('input[name=q25av]:checked').val() ? $('input[name=q25av]:checked').val() : -1;
                    grille.q26av = $('input[name=q26av]:checked').val() ? $('input[name=q26av]:checked').val() : -1;
                    grille.q27av = $('input[name=q27av]:checked').val() ? $('input[name=q27av]:checked').val() : -1;
                    grille.q28av = $('input[name=q28av]:checked').val() ? $('input[name=q28av]:checked').val() : -1;
                    grille.q29av = $('input[name=q29av]:checked').val() ? $('input[name=q29av]:checked').val() : -1;
                    grille.q30av = $('input[name=q30av]:checked').val() ? $('input[name=q30av]:checked').val() : -1;
                    grille.q31av = $('input[name=q31av]:checked').val() ? $('input[name=q31av]:checked').val() : -1;
                    grille.q32av = $('input[name=q32av]:checked').val() ? $('input[name=q32av]:checked').val() : -1;
                    grille.q33av = $('input[name=q33av]:checked').val() ? $('input[name=q33av]:checked').val() : -1;
                    grille.q34av = $('input[name=q34av]:checked').val() ? $('input[name=q34av]:checked').val() : -1;
                    grille.q35av = $('input[name=q35av]:checked').val() ? $('input[name=q35av]:checked').val() : -1;
                    grille.q36av = $('input[name=q36av]:checked').val() ? $('input[name=q36av]:checked').val() : -1;
                    grille.q37av = $('input[name=q37av]:checked').val() ? $('input[name=q37av]:checked').val() : -1;
                    grille.q38av = $('input[name=q38av]:checked').val() ? $('input[name=q38av]:checked').val() : -1;
                    grille.q39av = $('input[name=q39av]:checked').val() ? $('input[name=q39av]:checked').val() : -1;
                    grille.q40av = $('input[name=q40av]:checked').val() ? $('input[name=q40av]:checked').val() : -1;
                    grille.q41av = $('input[name=q41av]:checked').val() ? $('input[name=q41av]:checked').val() : -1;
                    grille.q42av = $('input[name=q42av]:checked').val() ? $('input[name=q42av]:checked').val() : -1;
                    grille.q43av = $('input[name=q43av]:checked').val() ? $('input[name=q43av]:checked').val() : -1;
                    grille.q44av = $('input[name=q44av]:checked').val() ? $('input[name=q44av]:checked').val() : -1;
                    grille.q45av = $('input[name=q45av]:checked').val() ? $('input[name=q45av]:checked').val() : -1;
                    grille.q46av = $('input[name=q46av]:checked').val() ? $('input[name=q46av]:checked').val() : -1;
                    grille.q47av = $('input[name=q47av]:checked').val() ? $('input[name=q47av]:checked').val() : -1;
                    grille.q48av = $('input[name=q48av]:checked').val() ? $('input[name=q48av]:checked').val() : -1;
                    grille.q49av = $('input[name=q49av]:checked').val() ? $('input[name=q49av]:checked').val() : -1;
                    grille.q50av = $('input[name=q50av]:checked').val() ? $('input[name=q50av]:checked').val() : -1;
                    grille.q51av = $('input[name=q51av]:checked').val() ? $('input[name=q51av]:checked').val() : -1;
                    grille.q52av = $('input[name=q52av]:checked').val() ? $('input[name=q52av]:checked').val() : -1;
                    grille.q53av = $('input[name=q53av]:checked').val() ? $('input[name=q53av]:checked').val() : -1;
                    grille.q54av = $('input[name=q54av]:checked').val() ? $('input[name=q54av]:checked').val() : -1;
                    grille.q55av = $('input[name=q55av]:checked').val() ? $('input[name=q55av]:checked').val() : -1;
                    grille.q56av = $('input[name=q56av]:checked').val() ? $('input[name=q56av]:checked').val() : -1;
                    grille.q57av = $('input[name=q57av]:checked').val() ? $('input[name=q57av]:checked').val() : -1;
                    grille.q58av = $('input[name=q58av]:checked').val() ? $('input[name=q58av]:checked').val() : -1;
                    grille.q59av = $('input[name=q59av]:checked').val() ? $('input[name=q59av]:checked').val() : -1;
                    grille.q60av = $('input[name=q60av]:checked').val() ? $('input[name=q60av]:checked').val() : -1;
                    grille.q61av = $('input[name=q61av]:checked').val() ? $('input[name=q61av]:checked').val() : -1;
                    grille.q62av = $('input[name=q62av]:checked').val() ? $('input[name=q62av]:checked').val() : -1;
                    grille.q63av = $('input[name=q63av]:checked').val() ? $('input[name=q63av]:checked').val() : -1;
                    grille.q64av = $('input[name=q64av]:checked').val() ? $('input[name=q64av]:checked').val() : -1;
                    grille.q65av = $('input[name=q65av]:checked').val() ? $('input[name=q65av]:checked').val() : -1;
                    
                    
                    grille.q4 = 1;
                    
                    MM.widgets.dialogClose2();
                    
                    thisuser.save({grille:grille});
                    //$('button#creerpif[user="'+user+'"]').replaceWith('<button onclick="clickPif($(this),$(this).attr(\'course\'),$(this).attr(\'user\'),$(this).attr(\'version\'),$(this).attr(\'pif\'))" class="btn grd-grisfonce text-blanc" id="pif" pif="" course="'+course+'" version="1" user="'+user+'" path="" module="" class="btn grd-grisfonce text-rouge">PIF</button>');
                    //$('button#creerpif[user="'+user+'"]').unbind('click');
                    //$('button#creerpif[user="'+user+'"]').attr('id','pif');
                    //$('button#pif[user="'+user+'"]').html('PIF');
                    //$('button#pif[user="'+user+'"]').attr('class','btn grd-grisfonce text-blanc');
                    
                    MM.Router.navigate("eleves/" + course, {trigger: true} );
                    
                    MM.widgets.dialogClose2();
                    MM.widgets.dialogClose();
                    grillea4(button,user,course,version);
                };
                
                var html3 = "Pour valider, veuillez compléter entièrement la grille de positionnement.";
               
                MM.widgets.dialog2(html3, options3);
                
            } else {
                
                MM.log('Grille Complete');
                if (grille=="") {
                    grille={};
                }
                
                grille.q1av = $('input[name=q1av]:checked').val() ? $('input[name=q1av]:checked').val() : -1;
                grille.q2av = $('input[name=q2av]:checked').val() ? $('input[name=q2av]:checked').val() : -1;
                grille.q3av = $('input[name=q3av]:checked').val() ? $('input[name=q3av]:checked').val() : -1;
                grille.q4av = $('input[name=q4av]:checked').val() ? $('input[name=q4av]:checked').val() : -1;
                grille.q5av = $('input[name=q5av]:checked').val() ? $('input[name=q5av]:checked').val() : -1;
                grille.q6av = $('input[name=q6av]:checked').val() ? $('input[name=q6av]:checked').val() : -1;
                grille.q7av = $('input[name=q7av]:checked').val() ? $('input[name=q7av]:checked').val() : -1;
                grille.q8av = $('input[name=q8av]:checked').val() ? $('input[name=q8av]:checked').val() : -1;
                grille.q9av = $('input[name=q9av]:checked').val() ? $('input[name=q9av]:checked').val() : -1;
                grille.q10av = $('input[name=q10av]:checked').val() ? $('input[name=q10av]:checked').val() : -1;
                grille.q11av = $('input[name=q11av]:checked').val() ? $('input[name=q11av]:checked').val() : -1;
                grille.q12av = $('input[name=q12av]:checked').val() ? $('input[name=q12av]:checked').val() : -1;
                grille.q13av = $('input[name=q13av]:checked').val() ? $('input[name=q13av]:checked').val() : -1;
                grille.q14av = $('input[name=q14av]:checked').val() ? $('input[name=q14av]:checked').val() : -1;
                grille.q15av = $('input[name=q15av]:checked').val() ? $('input[name=q15av]:checked').val() : -1;
                grille.q16av = $('input[name=q16av]:checked').val() ? $('input[name=q16av]:checked').val() : -1;
                grille.q17av = $('input[name=q17av]:checked').val() ? $('input[name=q17av]:checked').val() : -1;
                grille.q18av = $('input[name=q18av]:checked').val() ? $('input[name=q18av]:checked').val() : -1;
                grille.q19av = $('input[name=q19av]:checked').val() ? $('input[name=q19av]:checked').val() : -1;
                grille.q20av = $('input[name=q20av]:checked').val() ? $('input[name=q20av]:checked').val() : -1;
                grille.q21av = $('input[name=q21av]:checked').val() ? $('input[name=q21av]:checked').val() : -1;
                grille.q22av = $('input[name=q22av]:checked').val() ? $('input[name=q22av]:checked').val() : -1;
                grille.q23av = $('input[name=q23av]:checked').val() ? $('input[name=q23av]:checked').val() : -1;
                grille.q24av = $('input[name=q24av]:checked').val() ? $('input[name=q24av]:checked').val() : -1;
                grille.q25av = $('input[name=q25av]:checked').val() ? $('input[name=q25av]:checked').val() : -1;
                grille.q26av = $('input[name=q26av]:checked').val() ? $('input[name=q26av]:checked').val() : -1;
                grille.q27av = $('input[name=q27av]:checked').val() ? $('input[name=q27av]:checked').val() : -1;
                grille.q28av = $('input[name=q28av]:checked').val() ? $('input[name=q28av]:checked').val() : -1;
                grille.q29av = $('input[name=q29av]:checked').val() ? $('input[name=q29av]:checked').val() : -1;
                grille.q30av = $('input[name=q30av]:checked').val() ? $('input[name=q30av]:checked').val() : -1;
                grille.q31av = $('input[name=q31av]:checked').val() ? $('input[name=q31av]:checked').val() : -1;
                grille.q32av = $('input[name=q32av]:checked').val() ? $('input[name=q32av]:checked').val() : -1;
                grille.q33av = $('input[name=q33av]:checked').val() ? $('input[name=q33av]:checked').val() : -1;
                grille.q34av = $('input[name=q34av]:checked').val() ? $('input[name=q34av]:checked').val() : -1;
                grille.q35av = $('input[name=q35av]:checked').val() ? $('input[name=q35av]:checked').val() : -1;
                grille.q36av = $('input[name=q36av]:checked').val() ? $('input[name=q36av]:checked').val() : -1;
                grille.q37av = $('input[name=q37av]:checked').val() ? $('input[name=q37av]:checked').val() : -1;
                grille.q38av = $('input[name=q38av]:checked').val() ? $('input[name=q38av]:checked').val() : -1;
                grille.q39av = $('input[name=q39av]:checked').val() ? $('input[name=q39av]:checked').val() : -1;
                grille.q40av = $('input[name=q40av]:checked').val() ? $('input[name=q40av]:checked').val() : -1;
                grille.q41av = $('input[name=q41av]:checked').val() ? $('input[name=q41av]:checked').val() : -1;
                grille.q42av = $('input[name=q42av]:checked').val() ? $('input[name=q42av]:checked').val() : -1;
                grille.q43av = $('input[name=q43av]:checked').val() ? $('input[name=q43av]:checked').val() : -1;
                grille.q44av = $('input[name=q44av]:checked').val() ? $('input[name=q44av]:checked').val() : -1;
                grille.q45av = $('input[name=q45av]:checked').val() ? $('input[name=q45av]:checked').val() : -1;
                grille.q46av = $('input[name=q46av]:checked').val() ? $('input[name=q46av]:checked').val() : -1;
                grille.q47av = $('input[name=q47av]:checked').val() ? $('input[name=q47av]:checked').val() : -1;
                grille.q48av = $('input[name=q48av]:checked').val() ? $('input[name=q48av]:checked').val() : -1;
                grille.q49av = $('input[name=q49av]:checked').val() ? $('input[name=q49av]:checked').val() : -1;
                grille.q50av = $('input[name=q50av]:checked').val() ? $('input[name=q50av]:checked').val() : -1;
                grille.q51av = $('input[name=q51av]:checked').val() ? $('input[name=q51av]:checked').val() : -1;
                grille.q52av = $('input[name=q52av]:checked').val() ? $('input[name=q52av]:checked').val() : -1;
                grille.q53av = $('input[name=q53av]:checked').val() ? $('input[name=q53av]:checked').val() : -1;
                grille.q54av = $('input[name=q54av]:checked').val() ? $('input[name=q54av]:checked').val() : -1;
                grille.q55av = $('input[name=q55av]:checked').val() ? $('input[name=q55av]:checked').val() : -1;
                grille.q56av = $('input[name=q56av]:checked').val() ? $('input[name=q56av]:checked').val() : -1;
                grille.q57av = $('input[name=q57av]:checked').val() ? $('input[name=q57av]:checked').val() : -1;
                grille.q58av = $('input[name=q58av]:checked').val() ? $('input[name=q58av]:checked').val() : -1;
                grille.q59av = $('input[name=q59av]:checked').val() ? $('input[name=q59av]:checked').val() : -1;
                grille.q60av = $('input[name=q60av]:checked').val() ? $('input[name=q60av]:checked').val() : -1;
                grille.q61av = $('input[name=q61av]:checked').val() ? $('input[name=q61av]:checked').val() : -1;
                grille.q62av = $('input[name=q62av]:checked').val() ? $('input[name=q62av]:checked').val() : -1;
                grille.q63av = $('input[name=q63av]:checked').val() ? $('input[name=q63av]:checked').val() : -1;
                grille.q64av = $('input[name=q64av]:checked').val() ? $('input[name=q64av]:checked').val() : -1;
                grille.q65av = $('input[name=q65av]:checked').val() ? $('input[name=q65av]:checked').val() : -1;
                
                
                grille.q4 = 2;
                
                //MM.log('Grille:'+grille+'/'+grille.q4);
                
                var options4= {
                    title: '',
                    buttons: {}
                };
                options4.buttons["Annuler"] = function() {
                    MM.widgets.dialogClose2();
                };
                
                options4.buttons["Je valide"] = function() {
                    MM.log('Enregistrer et Valider Grille 1A');
                    thisuser.save({grille:grille});
                    //$('button#creerpif[user="'+user+'"]').replaceWith('<button onclick="clickPif($(this),$(this).attr(\'course\'),$(this).attr(\'user\'),$(this).attr(\'version\'),$(this).attr(\'pif\'))" class="btn grd-grisfonce text-blanc" id="pif" pif="" course="'+course+'" version="1" user="'+user+'" path="" module="" class="btn grd-grisfonce text-rouge">PIF</button>');
                    //$('button#creerpif[user="'+user+'"]').unbind('click');
                    //$('button#creerpif[user="'+user+'"]').attr('id','pif');
                    //$('button#pif[user="'+user+'"]').html('PIF');
                    //$('button#pif[user="'+user+'"]').attr('class','btn grd-grisfonce text-blanc');
                    
                    MM.Router.navigate("eleves/" + course, {trigger: true} );
                    
                    MM.widgets.dialogClose2();
                    MM.widgets.dialogClose();
                    aval($('button#pif[user="'+user+'"]'),user,course,version);
                    
                };
                
                var html4 = "En validant la grille, vous mettrez à jour le Protocole de Formation (PIF) de votre stagiaire.<br/>Vos réponses ne pourront plus être modifiées.";
               
                MM.widgets.dialog2(html4, options4);
                
                
                
            }
            
        };
        options2.buttons["Valider la grille"]["style"] = "modal-button-7";
    }
    
    $("#app-dialog").addClass('full-screen-dialog2');
    $("#app-dialog .modalContent").css('height','85vh');
    MM.widgets.dialog(html, options2);
    //document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
    document.getElementById("pifContent").style.height = (window.innerHeight - 134) + "px";
    document.getElementById("pifContent").style.maxHeight = (window.innerHeight - 134) + "px";
    document.getElementById("secondblock").style.height = (window.innerHeight - 284) + "px";

    var heightScroll = 0;
    $("tr#title").each(function( index ) {
        heightScroll=$(this).height();
        $(this).on(MM.clickType, function(e) {
            var mytr = $(this);
            if ($(this).attr('opened') == 0) {
                $(this).nextUntil( $('tr.title'), "tr" ).show();
                $(this).attr('opened',1);
                
                $( "tr#title" ).each(function( index2 ) {
                  if ($(this).is(mytr)) {
                  } else {
                    $(this).nextUntil( $('tr#title'), "tr" ).hide();
                    $(this).attr('opened',0);
                  }
                });
                //var offset = $(this).offset().top - $("#secondblock").offset().top;
                MM.log('OFFSET:'+heightScroll+'/'+(heightScroll*(index+1)));
                $('#secondblock').scrollTop((heightScroll*(index+1)) - (heightScroll/2));
            } else {
                $(this).nextUntil( $('tr#title'), "tr" ).hide();
                $(this).attr('opened',0);
                $( "tr#title" ).each(function( index3 ) {
                  if ($(this).is(mytr)) {
                  } else {
                     $(this).nextUntil( $('tr#title'), "tr" ).hide();
                     $(this).attr('opened',0);
                  }
                  
                });
            }
            
        });
        
        if ($(this).attr('opened') == 1) {
            $(this).nextUntil( $('tr.title'), "tr" ).show();
        }
        
        if ($(this).attr('opened') == 0) {
            $(this).nextUntil( $('tr#title'), "tr" ).hide();
        }
        
    });
    
}


//Grille A5             
function grillea5(button,user,course,version) {
    
    MM.log('GRILLE A5 clicked');
    
    var button = button;
    var course = course;
    var courseId = course;
    var user = user;
    var version = version;
    var thisuser = MM.db.get("users", MM.config.current_site.id + "-" + user);
    
    
    var users = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var usergrille = users[0].toJSON();
    var grille = usergrille.grille;
    var pifs = usergrille.pif;
    MM.log('User:'+users[0]+'/UserGrille:'+usergrille+'/Grille:'+grille+'/Pif:'+pifs);
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == course;
    });
    
    if (grille!="[]" && grille!="" && grille.q5 == 2)
        var disabled = 'disabled="disabled"';
    else disabled='';
    
    var highlight = ' style="background-color:#ff0000"';
    var style="";
    
    
    var html = '<div id="pifContent" style="overflow-y:hidden">';
    html += '<h1 align="center" class="grille">Evaluation des compétences <span class="red">en aval</span> de la formation</h1>';
    html += '<h1 align="center" class="grille">Grille de positionnement <span class="red">Sanitaire</span></h1>';
    
    html += '<div id="firstcolumngrille">';
    html += '<div id="firstblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo" style="border:0px;background-color:#fff">';
    html+='<tr style="border:0px;background-color:#fff;"><td style="width:50%;border:0px">&nbsp;</td><td style="width:16%;border:0px"><strong>Non fait</strong></td><td style="width:16%;border:0px"><strong>Partiellement fait</strong></td><td style="border:0px;width:16%"><strong>Fait</strong></td></tr>';
    html+='</table>';
    html+='</div>';
    
    html += '<div id="secondblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
    html+= '<tr><td colspan="4"></td></tr>';
    //QUESTION Q1AV
    html+='<tr id="title" opened="1">';
    html+='<td colspan="5">L\'agent identifie les attentes des clients</td>';
    html+='</tr>';
    
    if (grille.q1av == 3 || grille.q1av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q5 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q5 == 1 && grille.q1av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">L\'hotesse d\'accueil</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="3" '+disabled;
    if (grille.q1av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="0" '+disabled;
    if (grille.q1av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="1" '+disabled;
    if (grille.q1av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="2" '+disabled;
    if (grille.q1av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q2AV
    if (grille.q2av == 3 || grille.q2av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q5 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q5 == 1 && grille.q2av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le salarié de l\'entreprise client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="3" '+disabled;
    if (grille.q2av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="0" '+disabled;
    if (grille.q2av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="1" '+disabled;
    if (grille.q2av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="2" '+disabled;
    if (grille.q2av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q3AV
    if (grille.q3av == 3 || grille.q3av == undefined)
        disabled='';
    else {
        if (grille!="[]" && grille!="" && grille.q5 == 2)
            var disabled = 'disabled="disabled"';
        else disabled='';
    }
    if (grille.q5 == 1 && grille.q3av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le responsable de la propreté</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="3" '+disabled;
    if (grille.q3av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="0" '+disabled;
    if (grille.q3av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="1" '+disabled;
    if (grille.q3av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="2" '+disabled;
    if (grille.q3av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q4AV
    if (grille.q4av == 3 || grille.q4av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q4av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le directeur</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="3" '+disabled;
    if (grille.q4av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="0" '+disabled;
    if (grille.q4av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="1" '+disabled;
    if (grille.q4av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="2" '+disabled;
    if (grille.q4av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q5AV
    if (grille.q5av == 3 || grille.q5av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les règles de communication</td>';
    html+='</tr>';
    
    if (grille.q5 == 1 && grille.q5av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">L\'attitude professionnelle</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="3" '+disabled;
    if (grille.q5av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="0" '+disabled;
    if (grille.q5av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="1" '+disabled;
    if (grille.q5av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="2" '+disabled;
    if (grille.q5av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q6AV
    if (grille.q6av == 3 || grille.q6av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q6av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'écoute active</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="3" '+disabled;
    if (grille.q6av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="0" '+disabled;
    if (grille.q6av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="1" '+disabled;
    if (grille.q6av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="2" '+disabled;
    if (grille.q6av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q7AV
    if (grille.q7av == 3 || grille.q7av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q7av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La reformulation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="3" '+disabled;
    if (grille.q7av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="0" '+disabled;
    if (grille.q7av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="1" '+disabled;
    if (grille.q7av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="2" '+disabled;
    if (grille.q7av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q8AV
    if (grille.q8av == 3 || grille.q8av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q8av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les types de question</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="3" '+disabled;
    if (grille.q8av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="0" '+disabled;
    if (grille.q8av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="1" '+disabled;
    if (grille.q8av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="2" '+disabled;
    if (grille.q8av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q9AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent traite les demandes et les réclamations</td>';
    html+='</tr>';
    
    if (grille.q9av == 3 || grille.q9av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q9av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Le traitement des demandes client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="3" '+disabled;
    if (grille.q9av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="0" '+disabled;
    if (grille.q9av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="1" '+disabled;
    if (grille.q9av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="2" '+disabled;
    if (grille.q9av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q10AV
    if (grille.q10av == 3 || grille.q10av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q10av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le traitement des réclamations</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="3" '+disabled;
    if (grille.q10av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="0" '+disabled;
    if (grille.q10av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="1" '+disabled;
    if (grille.q10av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="2" '+disabled;
    if (grille.q10av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q11AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent nomme les éléments à nettoyer</td>';
    html+='</tr>';
    
    if (grille.q11av == 3 || grille.q11av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q11av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Le bureau</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="3" '+disabled;
    if (grille.q11av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="0" '+disabled;
    if (grille.q11av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="1" '+disabled;
    if (grille.q11av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="2" '+disabled;
    if (grille.q11av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q12AV
    if (grille.q12av == 3 || grille.q12av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q12av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le sanitaire</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="3" '+disabled;
    if (grille.q12av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="0" '+disabled;
    if (grille.q12av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="1" '+disabled;
    if (grille.q12av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="2" '+disabled;
    if (grille.q12av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q13AV
    if (grille.q13av == 3 || grille.q13av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q13av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'ascenseur</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="3" '+disabled;
    if (grille.q13av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="0" '+disabled;
    if (grille.q13av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="1" '+disabled;
    if (grille.q13av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="2" '+disabled;
    if (grille.q13av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q14AV
    if (grille.q14av == 3 || grille.q14av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q14av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'escalier</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="3" '+disabled;
    if (grille.q14av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="0" '+disabled;
    if (grille.q14av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="1" '+disabled;
    if (grille.q14av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="2" '+disabled;
    if (grille.q14av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q15AV
    if (grille.q15av == 3 || grille.q15av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q15av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le hall d\'entrée</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="3" '+disabled;
    if (grille.q15av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="0" '+disabled;
    if (grille.q15av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="1" '+disabled;
    if (grille.q15av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="2" '+disabled;
    if (grille.q15av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q16AV
    if (grille.q16av == 3 || grille.q16av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent utilise le matériel et les produits de nettoyage</td>';
    html+='</tr>';
    
    if (grille.q5 == 1 && grille.q16av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">La désignation des organes de l\'aspirateur à poussières</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="3" '+disabled;
    if (grille.q16av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="0" '+disabled;
    if (grille.q16av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="1" '+disabled;
    if (grille.q16av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="2" '+disabled;
    if (grille.q16av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q17AV
    if (grille.q17av == 3 || grille.q17av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q17av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'entretien de l\'aspirateur à poussières</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="3" '+disabled;
    if (grille.q17av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="0" '+disabled;
    if (grille.q17av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="1" '+disabled;
    if (grille.q17av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="2" '+disabled;
    if (grille.q17av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q18AV
    if (grille.q18av == 3 || grille.q18av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q18av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La désignation du matériel de nettoyage</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="3" '+disabled;
    if (grille.q18av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="0" '+disabled;
    if (grille.q18av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="1" '+disabled;
    if (grille.q18av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="2" '+disabled;
    if (grille.q18av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q19AV
    if (grille.q19av == 3 || grille.q19av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q19av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'utilsation des produits de nettoyage</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="3" '+disabled;
    if (grille.q19av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="0" '+disabled;
    if (grille.q19av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="1" '+disabled;
    if (grille.q19av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="2" '+disabled;
    if (grille.q19av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q66AV
    if (grille.q66av == 3 || grille.q66av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q66av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le matériel et les produits adaptés aux travaux effectués</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q66av" value="3" '+disabled;
    if (grille.q66av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q66av" value="0" '+disabled;
    if (grille.q66av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q66av" value="1" '+disabled;
    if (grille.q66av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q66av" value="2" '+disabled;
    if (grille.q66av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q21AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les protocoles de nettoyage</td>';
    html+='</tr>';
    
    if (grille.q21av == 3 || grille.q21av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q21av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Les règles de tri des déchets</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="3" '+disabled;
    if (grille.q21av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="0" '+disabled;
    if (grille.q21av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="1" '+disabled;
    if (grille.q21av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="2" '+disabled;
    if (grille.q21av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q22AV
    if (grille.q22av == 3 || grille.q22av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q22av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique d\'essuyage humide</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="3" '+disabled;
    if (grille.q22av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="0" '+disabled;
    if (grille.q22av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="1" '+disabled;
    if (grille.q22av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="2" '+disabled;
    if (grille.q22av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q23AV
    if (grille.q23av == 3 || grille.q23av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q23av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique de balayage humide</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="3" '+disabled;
    if (grille.q23av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="0" '+disabled;
    if (grille.q23av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="1" '+disabled;
    if (grille.q23av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="2" '+disabled;
    if (grille.q23av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q24AV
    if (grille.q24av == 3 || grille.q24av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q24av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique d\'aspiration des sols</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="3" '+disabled;
    if (grille.q24av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="0" '+disabled;
    if (grille.q24av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="1" '+disabled;
    if (grille.q24av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="2" '+disabled;
    if (grille.q24av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q25AV
    if (grille.q25av == 3 || grille.q25av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q25av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique de lavage manuel</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="3" '+disabled;
    if (grille.q25av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="0" '+disabled;
    if (grille.q25av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="1" '+disabled;
    if (grille.q25av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="2" '+disabled;
    if (grille.q25av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q67AV
    if (grille.q67av == 3 || grille.q67av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q67av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Préparation des équipements</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q67av" value="3" '+disabled;
    if (grille.q67av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q67av" value="0" '+disabled;
    if (grille.q67av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q67av" value="1" '+disabled;
    if (grille.q67av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q67av" value="2" '+disabled;
    if (grille.q67av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q68AV
    if (grille.q68av == 3 || grille.q68av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q68av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Désinfection des appareils</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q68av" value="3" '+disabled;
    if (grille.q68av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q68av" value="0" '+disabled;
    if (grille.q68av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q68av" value="1" '+disabled;
    if (grille.q68av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q68av" value="2" '+disabled;
    if (grille.q68av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q69AV
    if (grille.q69av == 3 || grille.q69av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q69av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Désinfection des équipements</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q69av" value="3" '+disabled;
    if (grille.q69av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q69av" value="0" '+disabled;
    if (grille.q69av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q69av" value="1" '+disabled;
    if (grille.q69av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q69av" value="2" '+disabled;
    if (grille.q69av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q70AV
    if (grille.q70av == 3 || grille.q70av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q70av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Balayage et lavage</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q70av" value="3" '+disabled;
    if (grille.q70av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q70av" value="0" '+disabled;
    if (grille.q70av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q70av" value="1" '+disabled;
    if (grille.q70av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q70av" value="2" '+disabled;
    if (grille.q70av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q71AV
    if (grille.q71av == 3 || grille.q71av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q71av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Contrôle du résultat</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q71av" value="3" '+disabled;
    if (grille.q71av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q71av" value="0" '+disabled;
    if (grille.q71av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q71av" value="1" '+disabled;
    if (grille.q71av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q71av" value="2" '+disabled;
    if (grille.q71av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q31AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les règles d\'hygiène et de sécurité</td>';
    html+='</tr>';
    
    if (grille.q31av == 3 || grille.q31av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q31av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Les risques de glissade</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="3" '+disabled;
    if (grille.q31av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="0" '+disabled;
    if (grille.q31av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="1" '+disabled;
    if (grille.q31av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="2" '+disabled;
    if (grille.q31av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q32AV
    if (grille.q32av == 3 || grille.q32av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q32av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les risques chimiques</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="3" '+disabled;
    if (grille.q32av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="0" '+disabled;
    if (grille.q32av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="1" '+disabled;
    if (grille.q32av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="2" '+disabled;
    if (grille.q32av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q33AV
    if (grille.q33av == 3 || grille.q33av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q33av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les risques électriques</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="3" '+disabled;
    if (grille.q33av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="0" '+disabled;
    if (grille.q33av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="1" '+disabled;
    if (grille.q33av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="2" '+disabled;
    if (grille.q33av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q34AV
    if (grille.q34av == 3 || grille.q34av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q34av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les risques de chute</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="3" '+disabled;
    if (grille.q34av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="0" '+disabled;
    if (grille.q34av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="1" '+disabled;
    if (grille.q34av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="2" '+disabled;
    if (grille.q34av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q35AV
    if (grille.q35av == 3 || grille.q35av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q35av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les équipements de protection individuelle</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="3" '+disabled;
    if (grille.q35av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="0" '+disabled;
    if (grille.q35av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="1" '+disabled;
    if (grille.q35av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="2" '+disabled;
    if (grille.q35av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q36AV
    if (grille.q36av == 3 || grille.q36av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q36av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'avertissement</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="3" '+disabled;
    if (grille.q36av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="0" '+disabled;
    if (grille.q36av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="1" '+disabled;
    if (grille.q36av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="2" '+disabled;
    if (grille.q36av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q37AV
    if (grille.q37av == 3 || grille.q37av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q37av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'interdiction</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="3" '+disabled;
    if (grille.q37av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="0" '+disabled;
    if (grille.q37av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="1" '+disabled;
    if (grille.q37av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="2" '+disabled;
    if (grille.q37av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q38AV
    if (grille.q38av == 3 || grille.q38av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q38av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'obligation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="3" '+disabled;
    if (grille.q38av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="0" '+disabled;
    if (grille.q38av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="1" '+disabled;
    if (grille.q38av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="2" '+disabled;
    if (grille.q38av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q39AV
    if (grille.q39av == 3 || grille.q39av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q39av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'évacuation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="3" '+disabled;
    if (grille.q39av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="0" '+disabled;
    if (grille.q39av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="1" '+disabled;
    if (grille.q39av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="2" '+disabled;
    if (grille.q39av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q40AV
    if (grille.q40av == 3 || grille.q40av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q40av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux de lutte contre l\'incendie</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="3" '+disabled;
    if (grille.q40av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="0" '+disabled;
    if (grille.q40av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="1" '+disabled;
    if (grille.q40av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="2" '+disabled;
    if (grille.q40av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q41AV
    if (grille.q41av == 3 || grille.q41av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q41av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les principes de l\'hygiène</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="3" '+disabled;
    if (grille.q41av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="0" '+disabled;
    if (grille.q41av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="1" '+disabled;
    if (grille.q41av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="2" '+disabled;
    if (grille.q41av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q42AV
    if (grille.q42av == 3 || grille.q42av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
     if (grille.q5 == 1 && grille.q42av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'élimination des microbes</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="3" '+disabled;
    if (grille.q42av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="0" '+disabled;
    if (grille.q42av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="1" '+disabled;
    if (grille.q42av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="2" '+disabled;
    if (grille.q42av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q43AV
    if (grille.q43av == 3 || grille.q43av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q43av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les soins du corps</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="3" '+disabled;
    if (grille.q43av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="0" '+disabled;
    if (grille.q43av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="1" '+disabled;
    if (grille.q43av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="2" '+disabled;
    if (grille.q43av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q44AV
    if (grille.q44av == 3 || grille.q44av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q44av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'hygiène des mains</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="3" '+disabled;
    if (grille.q44av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="0" '+disabled;
    if (grille.q44av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="1" '+disabled;
    if (grille.q44av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="2" '+disabled;
    if (grille.q44av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q72AV
    if (grille.q72av == 3 || grille.q72av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q72av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les règles de sécurité appliquées aux travaux effectués</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q72av" value="3" '+disabled;
    if (grille.q72av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q72av" value="0" '+disabled;
    if (grille.q72av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q72av" value="1" '+disabled;
    if (grille.q72av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q72av" value="2" '+disabled;
    if (grille.q72av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q48AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les attitudes de services</td>';
    html+='</tr>';
    
    if (grille.q48av == 3 || grille.q48av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q48av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Les règles de politesse</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="3" '+disabled;
    if (grille.q48av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="0" '+disabled;
    if (grille.q48av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="1" '+disabled;
    if (grille.q48av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="2" '+disabled;
    if (grille.q48av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q49AV
    if (grille.q49av == 3 || grille.q49av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q49av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les règles de confidentialité</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="3" '+disabled;
    if (grille.q49av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="0" '+disabled;
    if (grille.q49av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="1" '+disabled;
    if (grille.q49av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="2" '+disabled;
    if (grille.q49av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q50AV
    if (grille.q50av == 3 || grille.q50av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q50av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le sens du service</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="3" '+disabled;
    if (grille.q50av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="0" '+disabled;
    if (grille.q50av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="1" '+disabled;
    if (grille.q50av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="2" '+disabled;
    if (grille.q50av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q51AV
    if (grille.q51av == 3 || grille.q51av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q51av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le comportement sur un site client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="3" '+disabled;
    if (grille.q51av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="0" '+disabled;
    if (grille.q51av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="1" '+disabled;
    if (grille.q51av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="2" '+disabled;
    if (grille.q51av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q73AV
    if (grille.q73av == 3 || grille.q73av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q73av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les règles de sécurité appliquées aux travaux effectués</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q73av" value="3" '+disabled;
    if (grille.q73av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q73av" value="0" '+disabled;
    if (grille.q73av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q73av" value="1" '+disabled;
    if (grille.q73av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q73av" value="2" '+disabled;
    if (grille.q73av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q74AV
    if (grille.q74av == 3 || grille.q74av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q74av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'accès aux installations</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q74av" value="3" '+disabled;
    if (grille.q74av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q74av" value="0" '+disabled;
    if (grille.q74av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q74av" value="1" '+disabled;
    if (grille.q74av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q74av" value="2" '+disabled;
    if (grille.q74av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    
    //QUESTION Q56AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent adopte les bonnes postures de travail</td>';
    html+='</tr>';
    
    if (grille.q56av == 3 || grille.q56av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q56av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Soulever une charge</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="3" '+disabled;
    if (grille.q56av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="0" '+disabled;
    if (grille.q56av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="1" '+disabled;
    if (grille.q56av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="2" '+disabled;
    if (grille.q56av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q57AV
    if (grille.q57av == 3 || grille.q57av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q57av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Tenir un aspirateurs à poussières</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="3" '+disabled;
    if (grille.q57av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="0" '+disabled;
    if (grille.q57av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="1" '+disabled;
    if (grille.q57av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="2" '+disabled;
    if (grille.q57av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q58AV
    if (grille.q58av == 3 || grille.q58av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q58av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Fixer une gaze sur un balai</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="3" '+disabled;
    if (grille.q58av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q58av" value="0" '+disabled;
    if (grille.q58av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q58av" value="1" '+disabled;
    if (grille.q58av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q58av" value="2" '+disabled;
    if (grille.q58av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q75AV
    if (grille.q75av == 3 || grille.q75av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q75av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les postures adaptées aux opérations effectuées</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q75av" value="3" '+disabled;
    if (grille.q75av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q75av" value="0" '+disabled;
    if (grille.q75av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q75av" value="1" '+disabled;
    if (grille.q75av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q75av" value="2" '+disabled;
    if (grille.q75av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q60AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent travaille en objectif de résultats</td>';
    html+='</tr>';
    
    if (grille.q60av == 3 || grille.q60av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q60av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">La qualité de service</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="3" '+disabled;
    if (grille.q60av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="0" '+disabled;
    if (grille.q60av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="1" '+disabled;
    if (grille.q60av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="2" '+disabled;
    if (grille.q60av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';

    //QUESTION Q61AV
    if (grille.q61av == 3 || grille.q61av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q61av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les missions qualité des acteurs de l\'entreprise</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="3" '+disabled;
    if (grille.q61av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="0" '+disabled;
    if (grille.q61av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="1" '+disabled;
    if (grille.q61av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="2" '+disabled;
    if (grille.q61av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q62AV
    if (grille.q62av == 3 || grille.q62av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q62av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les résultats attendus des opérations de nettoyage</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="3" '+disabled;
    if (grille.q62av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="0" '+disabled;
    if (grille.q62av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="1" '+disabled;
    if (grille.q62av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="2" '+disabled;
    if (grille.q62av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q63AV
    if (grille.q63av == 3 || grille.q63av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q63av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La démarche qualité appliquée à son travail</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="3" '+disabled;
    if (grille.q63av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="0" '+disabled;
    if (grille.q63av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="1" '+disabled;
    if (grille.q63av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="2" '+disabled;
    if (grille.q63av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q64AV
    if (grille.q64av == 3 || grille.q64av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q64av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La traçabilité des opérations effectuées</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="3" '+disabled;
    if (grille.q64av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="0" '+disabled;
    if (grille.q64av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="1" '+disabled;
    if (grille.q64av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="2" '+disabled;
    if (grille.q64av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q76AV
    if (grille.q76av == 3 || grille.q76av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q5 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q5 == 1 && grille.q76av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les actions de contrôle en fin de prestation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q76av" value="3" '+disabled;
    if (grille.q76av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q76av" value="0" '+disabled;
    if (grille.q76av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q76av" value="1" '+disabled;
    if (grille.q76av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q76av" value="2" '+disabled;
    if (grille.q76av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    html+='</table>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    
    
    
    var options2 = {
            title: 'Stagiaire : '+usergrille.fullname,
            width: "98%",
            marginTop: "5%",
            buttons: {}
        };
    
    //Grille 5 Validée
    if (grille!="[]" && grille!="" && grille.q5 == 2){
        
        options2.buttons["Fermer"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            aval(button,user,course,version);
        };
        options2.buttons["Fermer"]["style"] = "modal-button-8";
        
    } else {
        
        
        
        options2.buttons["Annuler"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            aval(button,user,course,version);
        };
        options2.buttons["Annuler"]["style"] = "modal-button-8";
        
        options2.buttons["Enregistrer"] = function() {
            
            MM.log('Enregistrer Grille 5A');
            if (grille=="") {
                grille={};
            }
            grille.q1av = $('input[name=q1av]:checked').val() ? $('input[name=q1av]:checked').val() : -1;
            grille.q2av = $('input[name=q2av]:checked').val() ? $('input[name=q2av]:checked').val() : -1;
            grille.q3av = $('input[name=q3av]:checked').val() ? $('input[name=q3av]:checked').val() : -1;
            grille.q4av = $('input[name=q4av]:checked').val() ? $('input[name=q4av]:checked').val() : -1;
            grille.q5av = $('input[name=q5av]:checked').val() ? $('input[name=q5av]:checked').val() : -1;
            grille.q6av = $('input[name=q6av]:checked').val() ? $('input[name=q6av]:checked').val() : -1;
            grille.q7av = $('input[name=q7av]:checked').val() ? $('input[name=q7av]:checked').val() : -1;
            grille.q8av = $('input[name=q8av]:checked').val() ? $('input[name=q8av]:checked').val() : -1;
            grille.q9av = $('input[name=q9av]:checked').val() ? $('input[name=q9av]:checked').val() : -1;
            grille.q10av = $('input[name=q10av]:checked').val() ? $('input[name=q10av]:checked').val() : -1;
            grille.q11av = $('input[name=q11av]:checked').val() ? $('input[name=q11av]:checked').val() : -1;
            grille.q12av = $('input[name=q12av]:checked').val() ? $('input[name=q12av]:checked').val() : -1;
            grille.q13av = $('input[name=q13av]:checked').val() ? $('input[name=q13av]:checked').val() : -1;
            grille.q14av = $('input[name=q14av]:checked').val() ? $('input[name=q14av]:checked').val() : -1;
            grille.q15av = $('input[name=q15av]:checked').val() ? $('input[name=q15av]:checked').val() : -1;
            grille.q16av = $('input[name=q16av]:checked').val() ? $('input[name=q16av]:checked').val() : -1;
            grille.q17av = $('input[name=q17av]:checked').val() ? $('input[name=q17av]:checked').val() : -1;
            grille.q18av = $('input[name=q18av]:checked').val() ? $('input[name=q18av]:checked').val() : -1;
            grille.q19av = $('input[name=q19av]:checked').val() ? $('input[name=q19av]:checked').val() : -1;
            grille.q66av = $('input[name=q66av]:checked').val() ? $('input[name=q20av]:checked').val() : -1;
            grille.q21av = $('input[name=q21av]:checked').val() ? $('input[name=q21av]:checked').val() : -1;
            grille.q22av = $('input[name=q22av]:checked').val() ? $('input[name=q22av]:checked').val() : -1;
            grille.q23av = $('input[name=q23av]:checked').val() ? $('input[name=q23av]:checked').val() : -1;
            grille.q24av = $('input[name=q24av]:checked').val() ? $('input[name=q24av]:checked').val() : -1;
            grille.q25av = $('input[name=q25av]:checked').val() ? $('input[name=q25av]:checked').val() : -1;
            grille.q67av = $('input[name=q67av]:checked').val() ? $('input[name=q26av]:checked').val() : -1;
            grille.q68av = $('input[name=q68av]:checked').val() ? $('input[name=q27av]:checked').val() : -1;
            grille.q69av = $('input[name=q69av]:checked').val() ? $('input[name=q28av]:checked').val() : -1;
            grille.q70av = $('input[name=q70av]:checked').val() ? $('input[name=q29av]:checked').val() : -1;
            grille.q71av = $('input[name=q70av]:checked').val() ? $('input[name=q30av]:checked').val() : -1;
            grille.q31av = $('input[name=q31av]:checked').val() ? $('input[name=q31av]:checked').val() : -1;
            grille.q32av = $('input[name=q32av]:checked').val() ? $('input[name=q32av]:checked').val() : -1;
            grille.q33av = $('input[name=q33av]:checked').val() ? $('input[name=q33av]:checked').val() : -1;
            grille.q34av = $('input[name=q34av]:checked').val() ? $('input[name=q34av]:checked').val() : -1;
            grille.q35av = $('input[name=q35av]:checked').val() ? $('input[name=q35av]:checked').val() : -1;
            grille.q36av = $('input[name=q36av]:checked').val() ? $('input[name=q36av]:checked').val() : -1;
            grille.q37av = $('input[name=q37av]:checked').val() ? $('input[name=q37av]:checked').val() : -1;
            grille.q38av = $('input[name=q38av]:checked').val() ? $('input[name=q38av]:checked').val() : -1;
            grille.q39av = $('input[name=q39av]:checked').val() ? $('input[name=q39av]:checked').val() : -1;
            grille.q40av = $('input[name=q40av]:checked').val() ? $('input[name=q40av]:checked').val() : -1;
            grille.q41av = $('input[name=q41av]:checked').val() ? $('input[name=q41av]:checked').val() : -1;
            grille.q42av = $('input[name=q42av]:checked').val() ? $('input[name=q42av]:checked').val() : -1;
            grille.q43av = $('input[name=q43av]:checked').val() ? $('input[name=q43av]:checked').val() : -1;
            grille.q44av = $('input[name=q44av]:checked').val() ? $('input[name=q44av]:checked').val() : -1;
            grille.q72av = $('input[name=q72av]:checked').val() ? $('input[name=q72av]:checked').val() : -1;
            grille.q48av = $('input[name=q48av]:checked').val() ? $('input[name=q48av]:checked').val() : -1;
            grille.q49av = $('input[name=q49av]:checked').val() ? $('input[name=q49av]:checked').val() : -1;
            grille.q50av = $('input[name=q50av]:checked').val() ? $('input[name=q50av]:checked').val() : -1;
            grille.q51av = $('input[name=q51av]:checked').val() ? $('input[name=q51av]:checked').val() : -1;
            grille.q73av = $('input[name=q73av]:checked').val() ? $('input[name=q73av]:checked').val() : -1;
            grille.q74av = $('input[name=q74av]:checked').val() ? $('input[name=q74av]:checked').val() : -1;
            grille.q56av = $('input[name=q56av]:checked').val() ? $('input[name=q56av]:checked').val() : -1;
            grille.q57av = $('input[name=q57av]:checked').val() ? $('input[name=q57av]:checked').val() : -1;
            grille.q58av = $('input[name=q58av]:checked').val() ? $('input[name=q58av]:checked').val() : -1;
            grille.q75av = $('input[name=q75av]:checked').val() ? $('input[name=q75av]:checked').val() : -1;
            grille.q60av = $('input[name=q60av]:checked').val() ? $('input[name=q60av]:checked').val() : -1;
            grille.q61av = $('input[name=q61av]:checked').val() ? $('input[name=q61av]:checked').val() : -1;
            grille.q62av = $('input[name=q62av]:checked').val() ? $('input[name=q62av]:checked').val() : -1;
            grille.q63av = $('input[name=q63av]:checked').val() ? $('input[name=q63av]:checked').val() : -1;
            grille.q64av = $('input[name=q64av]:checked').val() ? $('input[name=q64av]:checked').val() : -1;
            grille.q76av = $('input[name=q76av]:checked').val() ? $('input[name=q76av]:checked').val() : -1;
            
            
            grille.q5 = 1;
            
            MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
            
            thisuser.save({grille:grille});
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            aval(button,user,course,version);
            
        };
        options2.buttons["Enregistrer"]["style"] = "modal-button-6";
        
        options2.buttons["Valider la grille"] = function() {
            
            MM.log('Valider Grille 3A');
            
            if(!$('input[name=q1av]').is(':checked')
               || !$('input[name=q2av]').is(':checked')
               || !$('input[name=q3av]').is(':checked')
               || !$('input[name=q4av]').is(':checked')
               || !$('input[name=q5av]').is(':checked')
               || !$('input[name=q6av]').is(':checked')
               || !$('input[name=q7av]').is(':checked')
               || !$('input[name=q8av]').is(':checked')
               || !$('input[name=q9av]').is(':checked')
               || !$('input[name=q10av]').is(':checked')
               || !$('input[name=q11av]').is(':checked')
               || !$('input[name=q12av]').is(':checked')
               || !$('input[name=q13av]').is(':checked')
               || !$('input[name=q14av]').is(':checked')
               || !$('input[name=q15av]').is(':checked')
               || !$('input[name=q16av]').is(':checked')
               || !$('input[name=q17av]').is(':checked')
               || !$('input[name=q18av]').is(':checked')
               || !$('input[name=q19av]').is(':checked')
               || !$('input[name=q66av]').is(':checked')
               || !$('input[name=q21av]').is(':checked')
               || !$('input[name=q22av]').is(':checked')
               || !$('input[name=q23av]').is(':checked')
               || !$('input[name=q24av]').is(':checked')
               || !$('input[name=q25av]').is(':checked')
               || !$('input[name=q67av]').is(':checked')
               || !$('input[name=q68av]').is(':checked')
               || !$('input[name=q69av]').is(':checked')
               || !$('input[name=q70av]').is(':checked')
               || !$('input[name=q71av]').is(':checked')
               || !$('input[name=q31av]').is(':checked')
               || !$('input[name=q32av]').is(':checked')
               || !$('input[name=q33av]').is(':checked')
               || !$('input[name=q34av]').is(':checked')
               || !$('input[name=q35av]').is(':checked')
               || !$('input[name=q36av]').is(':checked')
               || !$('input[name=q37av]').is(':checked')
               || !$('input[name=q38av]').is(':checked')
               || !$('input[name=q39av]').is(':checked')
               || !$('input[name=q40av]').is(':checked')
               || !$('input[name=q41av]').is(':checked')
               || !$('input[name=q42av]').is(':checked')
               || !$('input[name=q43av]').is(':checked')
               || !$('input[name=q44av]').is(':checked')
               || !$('input[name=q72av]').is(':checked')
               || !$('input[name=q48av]').is(':checked')
               || !$('input[name=q49av]').is(':checked')
               || !$('input[name=q50av]').is(':checked')
               || !$('input[name=q51av]').is(':checked')
               || !$('input[name=q73av]').is(':checked')
               || !$('input[name=q74av]').is(':checked')
               || !$('input[name=q56av]').is(':checked')
               || !$('input[name=q57av]').is(':checked')
               || !$('input[name=q58av]').is(':checked')
               || !$('input[name=q75av]').is(':checked')
               || !$('input[name=q60av]').is(':checked')
               || !$('input[name=q61av]').is(':checked')
               || !$('input[name=q62av]').is(':checked')
               || !$('input[name=q63av]').is(':checked')
               || !$('input[name=q64av]').is(':checked')
               || !$('input[name=q76av]').is(':checked')
              ) {
            //if (!tested) {    
                MM.log('Grille Incomplete');
                
                var options3= {
                    title: '',
                    buttons: {}
                };
                
                options3.buttons["Fermer"] = function() {
                    MM.widgets.dialogClose2();
                    
                    grille.q1av = $('input[name=q1av]:checked').val() ? $('input[name=q1av]:checked').val() : -1;
                    grille.q2av = $('input[name=q2av]:checked').val() ? $('input[name=q2av]:checked').val() : -1;
                    grille.q3av = $('input[name=q3av]:checked').val() ? $('input[name=q3av]:checked').val() : -1;
                    grille.q4av = $('input[name=q4av]:checked').val() ? $('input[name=q4av]:checked').val() : -1;
                    grille.q5av = $('input[name=q5av]:checked').val() ? $('input[name=q5av]:checked').val() : -1;
                    grille.q6av = $('input[name=q6av]:checked').val() ? $('input[name=q6av]:checked').val() : -1;
                    grille.q7av = $('input[name=q7av]:checked').val() ? $('input[name=q7av]:checked').val() : -1;
                    grille.q8av = $('input[name=q8av]:checked').val() ? $('input[name=q8av]:checked').val() : -1;
                    grille.q9av = $('input[name=q9av]:checked').val() ? $('input[name=q9av]:checked').val() : -1;
                    grille.q10av = $('input[name=q10av]:checked').val() ? $('input[name=q10av]:checked').val() : -1;
                    grille.q11av = $('input[name=q11av]:checked').val() ? $('input[name=q11av]:checked').val() : -1;
                    grille.q12av = $('input[name=q12av]:checked').val() ? $('input[name=q12av]:checked').val() : -1;
                    grille.q13av = $('input[name=q13av]:checked').val() ? $('input[name=q13av]:checked').val() : -1;
                    grille.q14av = $('input[name=q14av]:checked').val() ? $('input[name=q14av]:checked').val() : -1;
                    grille.q15av = $('input[name=q15av]:checked').val() ? $('input[name=q15av]:checked').val() : -1;
                    grille.q16av = $('input[name=q16av]:checked').val() ? $('input[name=q16av]:checked').val() : -1;
                    grille.q17av = $('input[name=q17av]:checked').val() ? $('input[name=q17av]:checked').val() : -1;
                    grille.q18av = $('input[name=q18av]:checked').val() ? $('input[name=q18av]:checked').val() : -1;
                    grille.q19av = $('input[name=q19av]:checked').val() ? $('input[name=q19av]:checked').val() : -1;
                    grille.q66av = $('input[name=q66av]:checked').val() ? $('input[name=q20av]:checked').val() : -1;
                    grille.q21av = $('input[name=q21av]:checked').val() ? $('input[name=q21av]:checked').val() : -1;
                    grille.q22av = $('input[name=q22av]:checked').val() ? $('input[name=q22av]:checked').val() : -1;
                    grille.q23av = $('input[name=q23av]:checked').val() ? $('input[name=q23av]:checked').val() : -1;
                    grille.q24av = $('input[name=q24av]:checked').val() ? $('input[name=q24av]:checked').val() : -1;
                    grille.q25av = $('input[name=q25av]:checked').val() ? $('input[name=q25av]:checked').val() : -1;
                    grille.q67av = $('input[name=q67av]:checked').val() ? $('input[name=q26av]:checked').val() : -1;
                    grille.q68av = $('input[name=q68av]:checked').val() ? $('input[name=q27av]:checked').val() : -1;
                    grille.q69av = $('input[name=q69av]:checked').val() ? $('input[name=q28av]:checked').val() : -1;
                    grille.q70av = $('input[name=q70av]:checked').val() ? $('input[name=q29av]:checked').val() : -1;
                    grille.q71av = $('input[name=q70av]:checked').val() ? $('input[name=q30av]:checked').val() : -1;
                    grille.q31av = $('input[name=q31av]:checked').val() ? $('input[name=q31av]:checked').val() : -1;
                    grille.q32av = $('input[name=q32av]:checked').val() ? $('input[name=q32av]:checked').val() : -1;
                    grille.q33av = $('input[name=q33av]:checked').val() ? $('input[name=q33av]:checked').val() : -1;
                    grille.q34av = $('input[name=q34av]:checked').val() ? $('input[name=q34av]:checked').val() : -1;
                    grille.q35av = $('input[name=q35av]:checked').val() ? $('input[name=q35av]:checked').val() : -1;
                    grille.q36av = $('input[name=q36av]:checked').val() ? $('input[name=q36av]:checked').val() : -1;
                    grille.q37av = $('input[name=q37av]:checked').val() ? $('input[name=q37av]:checked').val() : -1;
                    grille.q38av = $('input[name=q38av]:checked').val() ? $('input[name=q38av]:checked').val() : -1;
                    grille.q39av = $('input[name=q39av]:checked').val() ? $('input[name=q39av]:checked').val() : -1;
                    grille.q40av = $('input[name=q40av]:checked').val() ? $('input[name=q40av]:checked').val() : -1;
                    grille.q41av = $('input[name=q41av]:checked').val() ? $('input[name=q41av]:checked').val() : -1;
                    grille.q42av = $('input[name=q42av]:checked').val() ? $('input[name=q42av]:checked').val() : -1;
                    grille.q43av = $('input[name=q43av]:checked').val() ? $('input[name=q43av]:checked').val() : -1;
                    grille.q44av = $('input[name=q44av]:checked').val() ? $('input[name=q44av]:checked').val() : -1;
                    grille.q72av = $('input[name=q72av]:checked').val() ? $('input[name=q72av]:checked').val() : -1;
                    grille.q48av = $('input[name=q48av]:checked').val() ? $('input[name=q48av]:checked').val() : -1;
                    grille.q49av = $('input[name=q49av]:checked').val() ? $('input[name=q49av]:checked').val() : -1;
                    grille.q50av = $('input[name=q50av]:checked').val() ? $('input[name=q50av]:checked').val() : -1;
                    grille.q51av = $('input[name=q51av]:checked').val() ? $('input[name=q51av]:checked').val() : -1;
                    grille.q73av = $('input[name=q73av]:checked').val() ? $('input[name=q73av]:checked').val() : -1;
                    grille.q74av = $('input[name=q74av]:checked').val() ? $('input[name=q74av]:checked').val() : -1;
                    grille.q56av = $('input[name=q56av]:checked').val() ? $('input[name=q56av]:checked').val() : -1;
                    grille.q57av = $('input[name=q57av]:checked').val() ? $('input[name=q57av]:checked').val() : -1;
                    grille.q58av = $('input[name=q58av]:checked').val() ? $('input[name=q58av]:checked').val() : -1;
                    grille.q75av = $('input[name=q75av]:checked').val() ? $('input[name=q75av]:checked').val() : -1;
                    grille.q60av = $('input[name=q60av]:checked').val() ? $('input[name=q60av]:checked').val() : -1;
                    grille.q61av = $('input[name=q61av]:checked').val() ? $('input[name=q61av]:checked').val() : -1;
                    grille.q62av = $('input[name=q62av]:checked').val() ? $('input[name=q62av]:checked').val() : -1;
                    grille.q63av = $('input[name=q63av]:checked').val() ? $('input[name=q63av]:checked').val() : -1;
                    grille.q64av = $('input[name=q64av]:checked').val() ? $('input[name=q64av]:checked').val() : -1;
                    grille.q76av = $('input[name=q76av]:checked').val() ? $('input[name=q76av]:checked').val() : -1;
                    
                    
                    grille.q5 = 1;
                    
                    MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
                    
                    thisuser.save({grille:grille});
                    MM.Router.navigate("eleves/" + course );
                    MM.widgets.dialogClose();
                    grillea5(button,user,course,version);
            
                };
                
                var html3 = "Pour valider, veuillez compléter entièrement la grille de positionnement.";
               
                MM.widgets.dialog2(html3, options3);
                
            } else {
                
                MM.log('Grille Complete');
                if (grille=="") {
                    grille={};
                }
                
                grille.q1av = $('input[name=q1av]:checked').val() ? $('input[name=q1av]:checked').val() : -1;
                grille.q2av = $('input[name=q2av]:checked').val() ? $('input[name=q2av]:checked').val() : -1;
                grille.q3av = $('input[name=q3av]:checked').val() ? $('input[name=q3av]:checked').val() : -1;
                grille.q4av = $('input[name=q4av]:checked').val() ? $('input[name=q4av]:checked').val() : -1;
                grille.q5av = $('input[name=q5av]:checked').val() ? $('input[name=q5av]:checked').val() : -1;
                grille.q6av = $('input[name=q6av]:checked').val() ? $('input[name=q6av]:checked').val() : -1;
                grille.q7av = $('input[name=q7av]:checked').val() ? $('input[name=q7av]:checked').val() : -1;
                grille.q8av = $('input[name=q8av]:checked').val() ? $('input[name=q8av]:checked').val() : -1;
                grille.q9av = $('input[name=q9av]:checked').val() ? $('input[name=q9av]:checked').val() : -1;
                grille.q10av = $('input[name=q10av]:checked').val() ? $('input[name=q10av]:checked').val() : -1;
                grille.q11av = $('input[name=q11av]:checked').val() ? $('input[name=q11av]:checked').val() : -1;
                grille.q12av = $('input[name=q12av]:checked').val() ? $('input[name=q12av]:checked').val() : -1;
                grille.q13av = $('input[name=q13av]:checked').val() ? $('input[name=q13av]:checked').val() : -1;
                grille.q14av = $('input[name=q14av]:checked').val() ? $('input[name=q14av]:checked').val() : -1;
                grille.q15av = $('input[name=q15av]:checked').val() ? $('input[name=q15av]:checked').val() : -1;
                grille.q16av = $('input[name=q16av]:checked').val() ? $('input[name=q16av]:checked').val() : -1;
                grille.q17av = $('input[name=q17av]:checked').val() ? $('input[name=q17av]:checked').val() : -1;
                grille.q18av = $('input[name=q18av]:checked').val() ? $('input[name=q18av]:checked').val() : -1;
                grille.q19av = $('input[name=q19av]:checked').val() ? $('input[name=q19av]:checked').val() : -1;
                grille.q66av = $('input[name=q66av]:checked').val() ? $('input[name=q20av]:checked').val() : -1;
                grille.q21av = $('input[name=q21av]:checked').val() ? $('input[name=q21av]:checked').val() : -1;
                grille.q22av = $('input[name=q22av]:checked').val() ? $('input[name=q22av]:checked').val() : -1;
                grille.q23av = $('input[name=q23av]:checked').val() ? $('input[name=q23av]:checked').val() : -1;
                grille.q24av = $('input[name=q24av]:checked').val() ? $('input[name=q24av]:checked').val() : -1;
                grille.q25av = $('input[name=q25av]:checked').val() ? $('input[name=q25av]:checked').val() : -1;
                grille.q67av = $('input[name=q67av]:checked').val() ? $('input[name=q26av]:checked').val() : -1;
                grille.q68av = $('input[name=q68av]:checked').val() ? $('input[name=q27av]:checked').val() : -1;
                grille.q69av = $('input[name=q69av]:checked').val() ? $('input[name=q28av]:checked').val() : -1;
                grille.q70av = $('input[name=q70av]:checked').val() ? $('input[name=q29av]:checked').val() : -1;
                grille.q71av = $('input[name=q70av]:checked').val() ? $('input[name=q30av]:checked').val() : -1;
                grille.q31av = $('input[name=q31av]:checked').val() ? $('input[name=q31av]:checked').val() : -1;
                grille.q32av = $('input[name=q32av]:checked').val() ? $('input[name=q32av]:checked').val() : -1;
                grille.q33av = $('input[name=q33av]:checked').val() ? $('input[name=q33av]:checked').val() : -1;
                grille.q34av = $('input[name=q34av]:checked').val() ? $('input[name=q34av]:checked').val() : -1;
                grille.q35av = $('input[name=q35av]:checked').val() ? $('input[name=q35av]:checked').val() : -1;
                grille.q36av = $('input[name=q36av]:checked').val() ? $('input[name=q36av]:checked').val() : -1;
                grille.q37av = $('input[name=q37av]:checked').val() ? $('input[name=q37av]:checked').val() : -1;
                grille.q38av = $('input[name=q38av]:checked').val() ? $('input[name=q38av]:checked').val() : -1;
                grille.q39av = $('input[name=q39av]:checked').val() ? $('input[name=q39av]:checked').val() : -1;
                grille.q40av = $('input[name=q40av]:checked').val() ? $('input[name=q40av]:checked').val() : -1;
                grille.q41av = $('input[name=q41av]:checked').val() ? $('input[name=q41av]:checked').val() : -1;
                grille.q42av = $('input[name=q42av]:checked').val() ? $('input[name=q42av]:checked').val() : -1;
                grille.q43av = $('input[name=q43av]:checked').val() ? $('input[name=q43av]:checked').val() : -1;
                grille.q44av = $('input[name=q44av]:checked').val() ? $('input[name=q44av]:checked').val() : -1;
                grille.q72av = $('input[name=q72av]:checked').val() ? $('input[name=q72av]:checked').val() : -1;
                grille.q48av = $('input[name=q48av]:checked').val() ? $('input[name=q48av]:checked').val() : -1;
                grille.q49av = $('input[name=q49av]:checked').val() ? $('input[name=q49av]:checked').val() : -1;
                grille.q50av = $('input[name=q50av]:checked').val() ? $('input[name=q50av]:checked').val() : -1;
                grille.q51av = $('input[name=q51av]:checked').val() ? $('input[name=q51av]:checked').val() : -1;
                grille.q73av = $('input[name=q73av]:checked').val() ? $('input[name=q73av]:checked').val() : -1;
                grille.q74av = $('input[name=q74av]:checked').val() ? $('input[name=q74av]:checked').val() : -1;
                grille.q56av = $('input[name=q56av]:checked').val() ? $('input[name=q56av]:checked').val() : -1;
                grille.q57av = $('input[name=q57av]:checked').val() ? $('input[name=q57av]:checked').val() : -1;
                grille.q58av = $('input[name=q58av]:checked').val() ? $('input[name=q58av]:checked').val() : -1;
                grille.q75av = $('input[name=q75av]:checked').val() ? $('input[name=q75av]:checked').val() : -1;
                grille.q60av = $('input[name=q60av]:checked').val() ? $('input[name=q60av]:checked').val() : -1;
                grille.q61av = $('input[name=q61av]:checked').val() ? $('input[name=q61av]:checked').val() : -1;
                grille.q62av = $('input[name=q62av]:checked').val() ? $('input[name=q62av]:checked').val() : -1;
                grille.q63av = $('input[name=q63av]:checked').val() ? $('input[name=q63av]:checked').val() : -1;
                grille.q64av = $('input[name=q64av]:checked').val() ? $('input[name=q64av]:checked').val() : -1;
                grille.q76av = $('input[name=q76av]:checked').val() ? $('input[name=q76av]:checked').val() : -1;
                
                
                grille.q5 = 2;
                
                //MM.log('Grille:'+grille+'/'+grille.q4);
                
                var options4= {
                    title: '',
                    buttons: {}
                };
                options4.buttons["Annuler"] = function() {
                    MM.widgets.dialogClose2();
                };
                
                options4.buttons["Je valide"] = function() {
                    MM.log('Enregistrer et Valider Grille 1A');
                    thisuser.save({grille:grille});
                    //$('button#creerpif[user="'+user+'"]').replaceWith('<button onclick="clickPif($(this),$(this).attr(\'course\'),$(this).attr(\'user\'),$(this).attr(\'version\'),$(this).attr(\'pif\'))" class="btn grd-grisfonce text-blanc" id="pif" pif="" course="'+course+'" version="1" user="'+user+'" path="" module="" class="btn grd-grisfonce text-rouge">PIF</button>');
                    //$('button#creerpif[user="'+user+'"]').unbind('click');
                    //$('button#creerpif[user="'+user+'"]').attr('id','pif');
                    //$('button#pif[user="'+user+'"]').html('PIF');
                    //$('button#pif[user="'+user+'"]').attr('class','btn grd-grisfonce text-blanc');
                    
                    MM.Router.navigate("eleves/" + course, {trigger: true} );
                    
                    MM.widgets.dialogClose2();
                    MM.widgets.dialogClose();
                    aval($('button#pif[user="'+user+'"]'),user,course,version);
                    
                };
                
                var html4 = "En validant la grille, vous mettrez à jour le Protocole de Formation (PIF) de votre stagiaire.<br/>Vos réponses ne pourront plus être modifiées.";
               
                MM.widgets.dialog2(html4, options4);
                
                
                
            }
            
        };
        options2.buttons["Valider la grille"]["style"] = "modal-button-7";
    }
    
    $("#app-dialog").addClass('full-screen-dialog2');
    $("#app-dialog .modalContent").css('height','85vh');
    MM.widgets.dialog(html, options2);
    //document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
    document.getElementById("pifContent").style.height = (window.innerHeight - 134) + "px";
    document.getElementById("pifContent").style.maxHeight = (window.innerHeight - 134) + "px";
    document.getElementById("secondblock").style.height = (window.innerHeight - 284) + "px";

    $("tr#title").each(function( index ) {
        $(this).on(MM.clickType, function(e) {
            var mytr = $(this);
            if ($(this).attr('opened') == 0) {
                $(this).nextUntil( $('tr.title'), "tr" ).show();
                $(this).attr('opened',1);
                
                $( "tr#title" ).each(function( index2 ) {
                  if ($(this).is(mytr)) {
                  } else {
                    $(this).nextUntil( $('tr#title'), "tr" ).hide();
                    $(this).attr('opened',0);
                  }
                });
            } else {
                $(this).nextUntil( $('tr#title'), "tr" ).hide();
                $(this).attr('opened',0);
                $( "tr#title" ).each(function( index3 ) {
                  if ($(this).is(mytr)) {
                  } else {
                     $(this).nextUntil( $('tr#title'), "tr" ).hide();
                     $(this).attr('opened',0);
                  }
                  
                });
            }
        });
        
        if ($(this).attr('opened') == 1) {
            $(this).nextUntil( $('tr.title'), "tr" ).show();
        }
        
        if ($(this).attr('opened') == 0) {
            $(this).nextUntil( $('tr#title'), "tr" ).hide();
        }
        
    });
    
}




//Grille A6             
function grillea6(button,user,course,version) {
    
    MM.log('GRILLE A6 clicked');
    
    var button = button;
    var course = course;
    var courseId = course;
    var user = user;
    var version = version;
    var thisuser = MM.db.get("users", MM.config.current_site.id + "-" + user);
    
    
    var users = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var usergrille = users[0].toJSON();
    var grille = usergrille.grille;
    var pifs = usergrille.pif;
    MM.log('User:'+users[0]+'/UserGrille:'+usergrille+'/Grille:'+grille+'/Pif:'+pifs);
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == course;
    });
    
    if (grille!="[]" && grille!="" && grille.q6 == 2)
        var disabled = 'disabled="disabled"';
    else disabled='';
    
    var highlight = ' style="background-color:#ff0000"';
    var style="";
    
    var html = '<div id="pifContent" style="overflow-y:hidden">';
    html += '<h1 align="center" class="grille">Evaluation des compétences <span class="red">en aval</span> de la formation</h1>';
    html += '<h1 align="center" class="grille">Grille de positionnement <span class="red">Parties Communes</span> </h1>';
    
    html += '<div id="firstcolumngrille">';
    html += '<div id="firstblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo" style="border:0px;background-color:#fff">';
    html+='<tr style="border:0px;background-color:#fff;"><td style="width:50%;border:0px">&nbsp;</td><td style="width:16%;border:0px"><strong>Non fait</strong></td><td style="width:16%;border:0px"><strong>Partiellement fait</strong></td><td style="border:0px;width:16%"><strong>Fait</strong></td></tr>';
    html+='</table>';
    html+='</div>';
    
    html += '<div id="secondblock">';
    html+= '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
    html+= '<tr><td colspan="4"></td></tr>';
     //QUESTION Q1AV
    html+='<tr id="title" opened="1">';
    html+='<td colspan="5">L\'agent identifie les attentes des clients</td>';
    html+='</tr>';
    
    if (grille.q1av == 3 || grille.q1av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q1av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">L\'hotesse d\'accueil</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="3" '+disabled;
    if (grille.q1av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="0" '+disabled;
    if (grille.q1av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="1" '+disabled;
    if (grille.q1av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q1av" value="2" '+disabled;
    if (grille.q1av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q2AV
    if (grille.q2av == 3 || grille.q2av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q2av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le salarié de l\'entreprise client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="3" '+disabled;
    if (grille.q2av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="0" '+disabled;
    if (grille.q2av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="1" '+disabled;
    if (grille.q2av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q2av" value="2" '+disabled;
    if (grille.q2av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q3AV
    if (grille.q3av == 3 || grille.q3av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q3av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le responsable de la propreté</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="3" '+disabled;
    if (grille.q3av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="0" '+disabled;
    if (grille.q3av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="1" '+disabled;
    if (grille.q3av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q3av" value="2" '+disabled;
    if (grille.q3av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q4AV
    if (grille.q4av == 3 || grille.q4av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q4av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le directeur</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="3" '+disabled;
    if (grille.q4av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="0" '+disabled;
    if (grille.q4av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="1" '+disabled;
    if (grille.q4av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q4av" value="2" '+disabled;
    if (grille.q4av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q5AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les règles de communication</td>';
    html+='</tr>';
    
    if (grille.q5av == 3 || grille.q5av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q5av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">L\'attitude professionnelle</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="3" '+disabled;
    if (grille.q5av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="0" '+disabled;
    if (grille.q5av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="1" '+disabled;
    if (grille.q5av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q5av" value="2" '+disabled;
    if (grille.q5av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q6AV
    if (grille.q6av == 3 || grille.q6av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q6av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'écoute active</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="3" '+disabled;
    if (grille.q6av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="0" '+disabled;
    if (grille.q6av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="1" '+disabled;
    if (grille.q6av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q6av" value="2" '+disabled;
    if (grille.q6av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q7AV
    if (grille.q7av == 3 || grille.q7av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q7av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La reformulation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="3" '+disabled;
    if (grille.q7av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="0" '+disabled;
    if (grille.q7av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="1" '+disabled;
    if (grille.q7av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q7av" value="2" '+disabled;
    if (grille.q7av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q8AV
    if (grille.q8av == 3 || grille.q8av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q8av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les types de question</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="3" '+disabled;
    if (grille.q8av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="0" '+disabled;
    if (grille.q8av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="1" '+disabled;
    if (grille.q8av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q8av" value="2" '+disabled;
    if (grille.q8av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q9AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent traite les demandes et les réclamations</td>';
    html+='</tr>';
    
    if (grille.q9av == 3 || grille.q9av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q9av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Le traitement des demandes client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="3" '+disabled;
    if (grille.q9av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="0" '+disabled;
    if (grille.q9av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="1" '+disabled;
    if (grille.q9av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q9av" value="2" '+disabled;
    if (grille.q9av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q10AV
    if (grille.q10av == 3 || grille.q10av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q10av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le traitement des réclamations</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="3" '+disabled;
    if (grille.q10av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="0" '+disabled;
    if (grille.q10av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="1" '+disabled;
    if (grille.q10av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q10av" value="2" '+disabled;
    if (grille.q10av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q11AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent nomme les éléments à nettoyer</td>';
    html+='</tr>';
    
    if (grille.q11av == 3 || grille.q11av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q11av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Le bureau</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="3" '+disabled;
    if (grille.q11av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="0" '+disabled;
    if (grille.q11av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="1" '+disabled;
    if (grille.q11av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q11av" value="2" '+disabled;
    if (grille.q11av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q12AV
    if (grille.q12av == 3 || grille.q12av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q12av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le sanitaire</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="3" '+disabled;
    if (grille.q12av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="0" '+disabled;
    if (grille.q12av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="1" '+disabled;
    if (grille.q12av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q12av" value="2" '+disabled;
    if (grille.q12av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q13AV
    if (grille.q13av == 3 || grille.q13av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q13av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'ascenseur</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="3" '+disabled;
    if (grille.q13av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="0" '+disabled;
    if (grille.q13av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="1" '+disabled;
    if (grille.q13av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q13av" value="2" '+disabled;
    if (grille.q13av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q14AV
    if (grille.q14av == 3 || grille.q14av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q14av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'escalier</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="3" '+disabled;
    if (grille.q14av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="0" '+disabled;
    if (grille.q14av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="1" '+disabled;
    if (grille.q14av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q14av" value="2" '+disabled;
    if (grille.q14av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q15AV
    if (grille.q15av == 3 || grille.q15av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q15av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le hall d\'entrée</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="3" '+disabled;
    if (grille.q15av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="0" '+disabled;
    if (grille.q15av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="1" '+disabled;
    if (grille.q15av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q15av" value="2" '+disabled;
    if (grille.q15av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q16AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent utilise le matériel et les produits de nettoyage</td>';
    html+='</tr>';
    
    if (grille.q16av == 3 || grille.q16av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q16av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">La désignation des organes de l\'aspirateur à poussières</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="3" '+disabled;
    if (grille.q16av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="0" '+disabled;
    if (grille.q16av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="1" '+disabled;
    if (grille.q16av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q16av" value="2" '+disabled;
    if (grille.q16av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q17AV
    if (grille.q17av == 3 || grille.q17av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q17av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'entretien de l\'aspirateur à poussières</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="3" '+disabled;
    if (grille.q17av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="0" '+disabled;
    if (grille.q17av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="1" '+disabled;
    if (grille.q17av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q17av" value="2" '+disabled;
    if (grille.q17av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q18AV
    if (grille.q18av == 3 || grille.q18av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q18av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La désignation du matériel de nettoyage</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="3" '+disabled;
    if (grille.q18av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="0" '+disabled;
    if (grille.q18av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="1" '+disabled;
    if (grille.q18av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q18av" value="2" '+disabled;
    if (grille.q18av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q19AV
    if (grille.q19av == 3 || grille.q19av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q19av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'utilsation des produits de nettoyage</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="3" '+disabled;
    if (grille.q19av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="0" '+disabled;
    if (grille.q19av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="1" '+disabled;
    if (grille.q19av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q19av" value="2" '+disabled;
    if (grille.q19av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q77AV
    if (grille.q77av == 3 || grille.q77av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
   if (grille.q6 == 1 && grille.q77av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le matériel et les produits adaptés aux travaux effectués</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q77av" value="3" '+disabled;
    if (grille.q77av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q77av" value="0" '+disabled;
    if (grille.q77av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q77av" value="1" '+disabled;
    if (grille.q77av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q77av" value="2" '+disabled;
    if (grille.q77av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q21AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les protocoles de nettoyage</td>';
    html+='</tr>';
    
    if (grille.q21av == 3 || grille.q21av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q21av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Les règles de tri des déchets</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="3" '+disabled;
    if (grille.q21av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="0" '+disabled;
    if (grille.q21av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="1" '+disabled;
    if (grille.q21av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q21av" value="2" '+disabled;
    if (grille.q21av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q22AV
    if (grille.q22av == 3 || grille.q22av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q22av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique d\'essuyage humide</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="3" '+disabled;
    if (grille.q22av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="0" '+disabled;
    if (grille.q22av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="1" '+disabled;
    if (grille.q22av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q22av" value="2" '+disabled;
    if (grille.q22av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q23AV
    if (grille.q23av == 3 || grille.q23av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q23av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique de balayage humide</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="3" '+disabled;
    if (grille.q23av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="0" '+disabled;
    if (grille.q23av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="1" '+disabled;
    if (grille.q23av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q23av" value="2" '+disabled;
    if (grille.q23av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q24AV
    if (grille.q24av == 3 || grille.q24av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q24av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique d\'aspiration des sols</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="3" '+disabled;
    if (grille.q24av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="0" '+disabled;
    if (grille.q24av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="1" '+disabled;
    if (grille.q24av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q24av" value="2" '+disabled;
    if (grille.q24av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q25AV
    if (grille.q25av == 3 || grille.q25av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q25av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La technique de lavage manuel</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="3" '+disabled;
    if (grille.q25av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="0" '+disabled;
    if (grille.q25av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="1" '+disabled;
    if (grille.q25av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q25av" value="2" '+disabled;
    if (grille.q25av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q78AV
    if (grille.q78av == 3 || grille.q78av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q78av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Nettoyage du hall d\'entrée</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q78av" value="3" '+disabled;
    if (grille.q78av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q78av" value="0" '+disabled;
    if (grille.q78av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q78av" value="1" '+disabled;
    if (grille.q78av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q78av" value="2" '+disabled;
    if (grille.q78av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q79AV
    if (grille.q79av == 3 || grille.q79av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q79av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Nettoyage de l\'ascenseur</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q79av" value="3" '+disabled;
    if (grille.q79av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q79av" value="0" '+disabled;
    if (grille.q79av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q79av" value="1" '+disabled;
    if (grille.q79av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q79av" value="2" '+disabled;
    if (grille.q79av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q80AV
    if (grille.q80av == 3 || grille.q80av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q80av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Nettoyage des circulations</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q80av" value="3" '+disabled;
    if (grille.q80av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q80av" value="0" '+disabled;
    if (grille.q80av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q80av" value="1" '+disabled;
    if (grille.q80av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q80av" value="2" '+disabled;
    if (grille.q80av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q81AV
    if (grille.q81av == 3 || grille.q81av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q81av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Nettoyage de l\'escalier</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q81av" value="3" '+disabled;
    if (grille.q81av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q81av" value="0" '+disabled;
    if (grille.q81av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q81av" value="1" '+disabled;
    if (grille.q81av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q81av" value="2" '+disabled;
    if (grille.q81av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q82AV
    if (grille.q82av == 3 || grille.q82av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q82av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Contrôle du résultat</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q82av" value="3" '+disabled;
    if (grille.q82av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q82av" value="0" '+disabled;
    if (grille.q82av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q82av" value="1" '+disabled;
    if (grille.q82av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q82av" value="2" '+disabled;
    if (grille.q82av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q31AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les règles d\'hygiène et de sécurité</td>';
    html+='</tr>';
    
    if (grille.q31av == 3 || grille.q31av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q31av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Les risques de glissade</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="3" '+disabled;
    if (grille.q31av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="0" '+disabled;
    if (grille.q31av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="1" '+disabled;
    if (grille.q31av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q31av" value="2" '+disabled;
    if (grille.q31av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q32AV
    if (grille.q32av == 3 || grille.q32av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q32av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les risques chimiques</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="3" '+disabled;
    if (grille.q32av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="0" '+disabled;
    if (grille.q32av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="1" '+disabled;
    if (grille.q32av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q32av" value="2" '+disabled;
    if (grille.q32av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q33AV
    if (grille.q33av == 3 || grille.q33av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q33av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les risques électriques</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="3" '+disabled;
    if (grille.q33av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="0" '+disabled;
    if (grille.q33av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="1" '+disabled;
    if (grille.q33av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q33av" value="2" '+disabled;
    if (grille.q33av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q34AV
    if (grille.q34av == 3 || grille.q34av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q34av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les risques de chute</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="3" '+disabled;
    if (grille.q34av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="0" '+disabled;
    if (grille.q34av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="1" '+disabled;
    if (grille.q34av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q34av" value="2" '+disabled;
    if (grille.q34av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q35AV
    if (grille.q35av == 3 || grille.q35av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q35av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les équipements de protection individuelle</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="3" '+disabled;
    if (grille.q35av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="0" '+disabled;
    if (grille.q35av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="1" '+disabled;
    if (grille.q35av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q35av" value="2" '+disabled;
    if (grille.q35av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q36AV
    if (grille.q36av == 3 || grille.q36av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q36av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'avertissement</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="3" '+disabled;
    if (grille.q36av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="0" '+disabled;
    if (grille.q36av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="1" '+disabled;
    if (grille.q36av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q36av" value="2" '+disabled;
    if (grille.q36av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q37AV
    if (grille.q37av == 3 || grille.q37av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q37av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'interdiction</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="3" '+disabled;
    if (grille.q37av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="0" '+disabled;
    if (grille.q37av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="1" '+disabled;
    if (grille.q37av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q37av" value="2" '+disabled;
    if (grille.q37av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q38AV
    if (grille.q38av == 3 || grille.q38av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q38av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'obligation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="3" '+disabled;
    if (grille.q38av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="0" '+disabled;
    if (grille.q38av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="1" '+disabled;
    if (grille.q38av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q38av" value="2" '+disabled;
    if (grille.q38av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q39AV
    if (grille.q39av == 3 || grille.q39av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q39av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux d\'évacuation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="3" '+disabled;
    if (grille.q39av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="0" '+disabled;
    if (grille.q39av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="1" '+disabled;
    if (grille.q39av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q39av" value="2" '+disabled;
    if (grille.q39av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q40AV
    if (grille.q40av == 3 || grille.q40av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q40av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les panneaux de lutte contre l\'incendie</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="3" '+disabled;
    if (grille.q40av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="0" '+disabled;
    if (grille.q40av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="1" '+disabled;
    if (grille.q40av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q40av" value="2" '+disabled;
    if (grille.q40av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q41AV
    if (grille.q41av == 3 || grille.q41av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q41av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les principes de l\'hygiène</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="3" '+disabled;
    if (grille.q41av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="0" '+disabled;
    if (grille.q41av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="1" '+disabled;
    if (grille.q41av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q41av" value="2" '+disabled;
    if (grille.q41av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q42AV
    if (grille.q42av == 3 || grille.q42av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
     if (grille.q6 == 1 && grille.q42av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'élimination des microbes</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="3" '+disabled;
    if (grille.q42av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="0" '+disabled;
    if (grille.q42av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="1" '+disabled;
    if (grille.q42av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q42av" value="2" '+disabled;
    if (grille.q42av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q43AV
    if (grille.q43av == 3 || grille.q43av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q43av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les soins du corps</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="3" '+disabled;
    if (grille.q43av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="0" '+disabled;
    if (grille.q43av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="1" '+disabled;
    if (grille.q43av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q43av" value="2" '+disabled;
    if (grille.q43av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q44AV
    if (grille.q44av == 3 || grille.q44av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q44av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'hygiène des mains</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="3" '+disabled;
    if (grille.q44av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="0" '+disabled;
    if (grille.q44av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="1" '+disabled;
    if (grille.q44av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q44av" value="2" '+disabled;
    if (grille.q44av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q83AV
    if (grille.q83av == 3 || grille.q83av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q83av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les règles de sécurité appliquées aux travaux effectués</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q83av" value="3" '+disabled;
    if (grille.q83av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q83av" value="0" '+disabled;
    if (grille.q83av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q83av" value="1" '+disabled;
    if (grille.q83av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q83av" value="2" '+disabled;
    if (grille.q83av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q48AV
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent applique les attitudes de services</td>';
    html+='</tr>';
    
    if (grille.q48av == 3 || grille.q48av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q48av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Les règles de politesse</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="3" '+disabled;
    if (grille.q48av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="0" '+disabled;
    if (grille.q48av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="1" '+disabled;
    if (grille.q48av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q48av" value="2" '+disabled;
    if (grille.q48av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q49AV
    if (grille.q49av == 3 || grille.q49av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q49av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les règles de confidentialité</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="3" '+disabled;
    if (grille.q49av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="0" '+disabled;
    if (grille.q49av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="1" '+disabled;
    if (grille.q49av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q49av" value="2" '+disabled;
    if (grille.q49av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q50AV
    if (grille.q50av == 3 || grille.q50av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q50av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le sens du service</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="3" '+disabled;
    if (grille.q50av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="0" '+disabled;
    if (grille.q50av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="1" '+disabled;
    if (grille.q50av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q50av" value="2" '+disabled;
    if (grille.q50av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q51AV
    if (grille.q51av == 3 || grille.q51av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q51av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Le comportement sur un site client</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="3" '+disabled;
    if (grille.q51av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="0" '+disabled;
    if (grille.q51av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="1" '+disabled;
    if (grille.q51av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q51av" value="2" '+disabled;
    if (grille.q51av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    
    
    //QUESTION Q84AV
    if (grille.q84av == 3 || grille.q84av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q84av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">L\'accès aux installations</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q84av" value="3" '+disabled;
    if (grille.q84av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q84av" value="0" '+disabled;
    if (grille.q84av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q84av" value="1" '+disabled;
    if (grille.q84av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q84av" value="2" '+disabled;
    if (grille.q84av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    
    //QUESTION Q56AV
    if (grille.q56av == 3 || grille.q56av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent adopte les bonnes postures de travail</td>';
    html+='</tr>';
    
    if (grille.q6 == 1 && grille.q56av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">Soulever une charge</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="3" '+disabled;
    if (grille.q56av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="0" '+disabled;
    if (grille.q56av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="1" '+disabled;
    if (grille.q56av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="2" '+disabled;
    if (grille.q56av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q57AV
    if (grille.q57av == 3 || grille.q57av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q57av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Tenir un aspirateurs à poussières</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="3" '+disabled;
    if (grille.q57av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="0" '+disabled;
    if (grille.q57av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="1" '+disabled;
    if (grille.q57av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q57av" value="2" '+disabled;
    if (grille.q57av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q58AV
    if (grille.q58av == 3 || grille.q58av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q58av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Fixer une gaze sur un balai</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q56av" value="3" '+disabled;
    if (grille.q58av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q58av" value="0" '+disabled;
    if (grille.q58av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q58av" value="1" '+disabled;
    if (grille.q58av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q58av" value="2" '+disabled;
    if (grille.q58av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q85AV
    if (grille.q85av == 3 || grille.q85av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q85av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les postures adaptées aux opérations effectuées</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q85av" value="3" '+disabled;
    if (grille.q85av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q85av" value="0" '+disabled;
    if (grille.q85av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q85av" value="1" '+disabled;
    if (grille.q85av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q85av" value="2" '+disabled;
    if (grille.q85av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q60AV
    if (grille.q60av == 3 || grille.q60av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    html+='<tr id="title" opened="0">';
    html+='<td colspan="5">L\'agent travaille en objectif de résultats</td>';
    html+='</tr>';
    
    if (grille.q6 == 1 && grille.q60av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left;width:50%" class="center2">La qualité de service</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="3" '+disabled;
    if (grille.q60av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="0" '+disabled;
    if (grille.q60av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="1" '+disabled;
    if (grille.q60av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left;width:16%" class="center2"><input type="radio" id="checkboxgrille1a" name="q60av" value="2" '+disabled;
    if (grille.q60av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';

    //QUESTION Q61AV
    if (grille.q61av == 3 || grille.q61av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q61av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les missions qualité des acteurs de l\'entreprise</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="3" '+disabled;
    if (grille.q61av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="0" '+disabled;
    if (grille.q61av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="1" '+disabled;
    if (grille.q61av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q61av" value="2" '+disabled;
    if (grille.q61av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q62AV
    if (grille.q62av == 3 || grille.q62av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q62av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les résultats attendus des opérations de nettoyage</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="3" '+disabled;
    if (grille.q62av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="0" '+disabled;
    if (grille.q62av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="1" '+disabled;
    if (grille.q62av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q62av" value="2" '+disabled;
    if (grille.q62av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q63AV
    if (grille.q63av == 3 || grille.q63av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q63av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La démarche qualité appliquée à son travail</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="3" '+disabled;
    if (grille.q63av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="0" '+disabled;
    if (grille.q63av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="1" '+disabled;
    if (grille.q63av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q63av" value="2" '+disabled;
    if (grille.q63av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q64AV
    if (grille.q64av == 3 || grille.q64av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q64av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">La traçabilité des opérations effectuées</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="3" '+disabled;
    if (grille.q64av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="0" '+disabled;
    if (grille.q64av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="1" '+disabled;
    if (grille.q64av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q64av" value="2" '+disabled;
    if (grille.q64av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    //QUESTION Q86AV
    if (grille.q86av == 3 || grille.q86av == undefined)
         disabled='';    else {         if (grille!="[]" && grille!="" && grille.q6 == 2)             var disabled = 'disabled="disabled"';         else disabled='';     }
    if (grille.q6 == 1 && grille.q86av == -1)
            style=highlight;
    else
            style="";
    html+='<tr '+style+'>';
    html+='<td style="height:40px;text-align:left" class="center2">Les actions de contrôle en fin de prestation</td>';
    /*
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q86av" value="3" '+disabled;
    if (grille.q86av == 3)
        html+=' checked="checked"';
    html+="></td>";
    */
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q86av" value="0" '+disabled;
    if (grille.q86av == 0)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q86av" value="1" '+disabled;
    if (grille.q86av == 1)
        html+=' checked="checked"';
    html+="></td>";
    html+='<td style="height:40px;text-align:left" class="center2"><input type="radio" id="checkboxgrille1a" name="q86av" value="2" '+disabled;
    if (grille.q86av == 2)
        html+=' checked="checked"';
    html+="></td>";
    html+='</tr>';
    
    html+='</table>';
     html += '</div>';
      html += '</div>';
    
    html += '</div>';
    
    
    
    
    var options2 = {
            title: 'Stagiaire : '+usergrille.fullname,
            width: "98%",
            marginTop: "5%",
            buttons: {}
        };
    
    //Grille 5 Validée
    if (grille!="[]" && grille!="" && grille.q6 == 2){
        
        options2.buttons["Fermer"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            aval(button,user,course,version);
        };
        options2.buttons["Fermer"]["style"] = "modal-button-8";
        
    } else {
        
        
        
        options2.buttons["Annuler"] = function() {
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            aval(button,user,course,version);
        };
        options2.buttons["Annuler"]["style"] = "modal-button-8";
        
        options2.buttons["Enregistrer"] = function() {
            
            MM.log('Enregistrer Grille 5A');
            if (grille=="") {
                grille={};
            }
            grille.q1av = $('input[name=q1av]:checked').val() ? $('input[name=q1av]:checked').val() : -1;
            grille.q2av = $('input[name=q2av]:checked').val() ? $('input[name=q2av]:checked').val() : -1;
            grille.q3av = $('input[name=q3av]:checked').val() ? $('input[name=q3av]:checked').val() : -1;
            grille.q4av = $('input[name=q4av]:checked').val() ? $('input[name=q4av]:checked').val() : -1;
            grille.q5av = $('input[name=q5av]:checked').val() ? $('input[name=q5av]:checked').val() : -1;
            grille.q6av = $('input[name=q6av]:checked').val() ? $('input[name=q6av]:checked').val() : -1;
            grille.q7av = $('input[name=q7av]:checked').val() ? $('input[name=q7av]:checked').val() : -1;
            grille.q8av = $('input[name=q8av]:checked').val() ? $('input[name=q8av]:checked').val() : -1;
            grille.q9av = $('input[name=q9av]:checked').val() ? $('input[name=q9av]:checked').val() : -1;
            grille.q10av = $('input[name=q10av]:checked').val() ? $('input[name=q10av]:checked').val() : -1;
            grille.q11av = $('input[name=q11av]:checked').val() ? $('input[name=q11av]:checked').val() : -1;
            grille.q12av = $('input[name=q12av]:checked').val() ? $('input[name=q12av]:checked').val() : -1;
            grille.q13av = $('input[name=q13av]:checked').val() ? $('input[name=q13av]:checked').val() : -1;
            grille.q14av = $('input[name=q14av]:checked').val() ? $('input[name=q14av]:checked').val() : -1;
            grille.q15av = $('input[name=q15av]:checked').val() ? $('input[name=q15av]:checked').val() : -1;
            grille.q16av = $('input[name=q16av]:checked').val() ? $('input[name=q16av]:checked').val() : -1;
            grille.q17av = $('input[name=q17av]:checked').val() ? $('input[name=q17av]:checked').val() : -1;
            grille.q18av = $('input[name=q18av]:checked').val() ? $('input[name=q18av]:checked').val() : -1;
            grille.q19av = $('input[name=q19av]:checked').val() ? $('input[name=q19av]:checked').val() : -1;
            grille.q77av = $('input[name=q77av]:checked').val() ? $('input[name=q77av]:checked').val() : -1;
            grille.q21av = $('input[name=q21av]:checked').val() ? $('input[name=q21av]:checked').val() : -1;
            grille.q22av = $('input[name=q22av]:checked').val() ? $('input[name=q22av]:checked').val() : -1;
            grille.q23av = $('input[name=q23av]:checked').val() ? $('input[name=q23av]:checked').val() : -1;
            grille.q24av = $('input[name=q24av]:checked').val() ? $('input[name=q24av]:checked').val() : -1;
            grille.q25av = $('input[name=q25av]:checked').val() ? $('input[name=q25av]:checked').val() : -1;
            grille.q78av = $('input[name=q78av]:checked').val() ? $('input[name=q78av]:checked').val() : -1;
            grille.q79av = $('input[name=q79av]:checked').val() ? $('input[name=q79av]:checked').val() : -1;
            grille.q80av = $('input[name=q80av]:checked').val() ? $('input[name=q80av]:checked').val() : -1;
            grille.q81av = $('input[name=q81av]:checked').val() ? $('input[name=q81av]:checked').val() : -1;
            grille.q82av = $('input[name=q82av]:checked').val() ? $('input[name=q82av]:checked').val() : -1;
            grille.q31av = $('input[name=q31av]:checked').val() ? $('input[name=q31av]:checked').val() : -1;
            grille.q32av = $('input[name=q32av]:checked').val() ? $('input[name=q32av]:checked').val() : -1;
            grille.q33av = $('input[name=q33av]:checked').val() ? $('input[name=q33av]:checked').val() : -1;
            grille.q34av = $('input[name=q34av]:checked').val() ? $('input[name=q34av]:checked').val() : -1;
            grille.q35av = $('input[name=q35av]:checked').val() ? $('input[name=q35av]:checked').val() : -1;
            grille.q36av = $('input[name=q36av]:checked').val() ? $('input[name=q36av]:checked').val() : -1;
            grille.q37av = $('input[name=q37av]:checked').val() ? $('input[name=q37av]:checked').val() : -1;
            grille.q38av = $('input[name=q38av]:checked').val() ? $('input[name=q38av]:checked').val() : -1;
            grille.q39av = $('input[name=q39av]:checked').val() ? $('input[name=q39av]:checked').val() : -1;
            grille.q40av = $('input[name=q40av]:checked').val() ? $('input[name=q40av]:checked').val() : -1;
            grille.q41av = $('input[name=q41av]:checked').val() ? $('input[name=q41av]:checked').val() : -1;
            grille.q42av = $('input[name=q42av]:checked').val() ? $('input[name=q42av]:checked').val() : -1;
            grille.q43av = $('input[name=q43av]:checked').val() ? $('input[name=q43av]:checked').val() : -1;
            grille.q44av = $('input[name=q44av]:checked').val() ? $('input[name=q44av]:checked').val() : -1;
            grille.q83av = $('input[name=q83av]:checked').val() ? $('input[name=q83av]:checked').val() : -1;
            grille.q48av = $('input[name=q48av]:checked').val() ? $('input[name=q48av]:checked').val() : -1;
            grille.q49av = $('input[name=q49av]:checked').val() ? $('input[name=q49av]:checked').val() : -1;
            grille.q50av = $('input[name=q50av]:checked').val() ? $('input[name=q50av]:checked').val() : -1;
            grille.q51av = $('input[name=q51av]:checked').val() ? $('input[name=q51av]:checked').val() : -1;
            grille.q84av = $('input[name=q84av]:checked').val() ? $('input[name=q84av]:checked').val() : -1;
            grille.q56av = $('input[name=q56av]:checked').val() ? $('input[name=q56av]:checked').val() : -1;
            grille.q57av = $('input[name=q57av]:checked').val() ? $('input[name=q57av]:checked').val() : -1;
            grille.q58av = $('input[name=q58av]:checked').val() ? $('input[name=q58av]:checked').val() : -1;
            grille.q85av = $('input[name=q85av]:checked').val() ? $('input[name=q85av]:checked').val() : -1;
            grille.q60av = $('input[name=q60av]:checked').val() ? $('input[name=q60av]:checked').val() : -1;
            grille.q61av = $('input[name=q61av]:checked').val() ? $('input[name=q61av]:checked').val() : -1;
            grille.q62av = $('input[name=q62av]:checked').val() ? $('input[name=q62av]:checked').val() : -1;
            grille.q63av = $('input[name=q63av]:checked').val() ? $('input[name=q63av]:checked').val() : -1;
            grille.q64av = $('input[name=q64av]:checked').val() ? $('input[name=q64av]:checked').val() : -1;
            grille.q86av = $('input[name=q86av]:checked').val() ? $('input[name=q86av]:checked').val() : -1;
            
            
            grille.q6 = 1;
            
            MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
            
            thisuser.save({grille:grille});
            MM.Router.navigate("eleves/" + course );
            MM.widgets.dialogClose();
            aval(button,user,course,version);
            
        };
        options2.buttons["Enregistrer"]["style"] = "modal-button-6";
        
        options2.buttons["Valider la grille"] = function() {
            
            MM.log('Valider Grille 6A');
            
            if(!$('input[name=q1av]').is(':checked')
               || !$('input[name=q2av]').is(':checked')
               || !$('input[name=q3av]').is(':checked')
               || !$('input[name=q4av]').is(':checked')
               || !$('input[name=q5av]').is(':checked')
               || !$('input[name=q6av]').is(':checked')
               || !$('input[name=q7av]').is(':checked')
               || !$('input[name=q8av]').is(':checked')
               || !$('input[name=q9av]').is(':checked')
               || !$('input[name=q10av]').is(':checked')
               || !$('input[name=q11av]').is(':checked')
               || !$('input[name=q12av]').is(':checked')
               || !$('input[name=q13av]').is(':checked')
               || !$('input[name=q14av]').is(':checked')
               || !$('input[name=q15av]').is(':checked')
               || !$('input[name=q16av]').is(':checked')
               || !$('input[name=q17av]').is(':checked')
               || !$('input[name=q18av]').is(':checked')
               || !$('input[name=q19av]').is(':checked')
               || !$('input[name=q77av]').is(':checked')
               || !$('input[name=q21av]').is(':checked')
               || !$('input[name=q22av]').is(':checked')
               || !$('input[name=q23av]').is(':checked')
               || !$('input[name=q24av]').is(':checked')
               || !$('input[name=q25av]').is(':checked')
               || !$('input[name=q78av]').is(':checked')
               || !$('input[name=q79av]').is(':checked')
               || !$('input[name=q80av]').is(':checked')
               || !$('input[name=q81av]').is(':checked')
               || !$('input[name=q82av]').is(':checked')
               || !$('input[name=q31av]').is(':checked')
               || !$('input[name=q32av]').is(':checked')
               || !$('input[name=q33av]').is(':checked')
               || !$('input[name=q34av]').is(':checked')
               || !$('input[name=q35av]').is(':checked')
               || !$('input[name=q36av]').is(':checked')
               || !$('input[name=q37av]').is(':checked')
               || !$('input[name=q38av]').is(':checked')
               || !$('input[name=q39av]').is(':checked')
               || !$('input[name=q40av]').is(':checked')
               || !$('input[name=q41av]').is(':checked')
               || !$('input[name=q42av]').is(':checked')
               || !$('input[name=q43av]').is(':checked')
               || !$('input[name=q44av]').is(':checked')
               || !$('input[name=q83av]').is(':checked')
               || !$('input[name=q48av]').is(':checked')
               || !$('input[name=q49av]').is(':checked')
               || !$('input[name=q50av]').is(':checked')
               || !$('input[name=q51av]').is(':checked')
               || !$('input[name=q84av]').is(':checked')
               || !$('input[name=q56av]').is(':checked')
               || !$('input[name=q57av]').is(':checked')
               || !$('input[name=q58av]').is(':checked')
               || !$('input[name=q85av]').is(':checked')
               || !$('input[name=q60av]').is(':checked')
               || !$('input[name=q61av]').is(':checked')
               || !$('input[name=q62av]').is(':checked')
               || !$('input[name=q63av]').is(':checked')
               || !$('input[name=q64av]').is(':checked')
               || !$('input[name=q86av]').is(':checked')
              ) {
            //if (!tested) {    
                MM.log('Grille Incomplete');
                
                var options3= {
                    title: '',
                    buttons: {}
                };
                
                options3.buttons["Fermer"] = function() {
                    MM.widgets.dialogClose2();
                    
                    grille.q1av = $('input[name=q1av]:checked').val() ? $('input[name=q1av]:checked').val() : -1;
                    grille.q2av = $('input[name=q2av]:checked').val() ? $('input[name=q2av]:checked').val() : -1;
                    grille.q3av = $('input[name=q3av]:checked').val() ? $('input[name=q3av]:checked').val() : -1;
                    grille.q4av = $('input[name=q4av]:checked').val() ? $('input[name=q4av]:checked').val() : -1;
                    grille.q5av = $('input[name=q5av]:checked').val() ? $('input[name=q5av]:checked').val() : -1;
                    grille.q6av = $('input[name=q6av]:checked').val() ? $('input[name=q6av]:checked').val() : -1;
                    grille.q7av = $('input[name=q7av]:checked').val() ? $('input[name=q7av]:checked').val() : -1;
                    grille.q8av = $('input[name=q8av]:checked').val() ? $('input[name=q8av]:checked').val() : -1;
                    grille.q9av = $('input[name=q9av]:checked').val() ? $('input[name=q9av]:checked').val() : -1;
                    grille.q10av = $('input[name=q10av]:checked').val() ? $('input[name=q10av]:checked').val() : -1;
                    grille.q11av = $('input[name=q11av]:checked').val() ? $('input[name=q11av]:checked').val() : -1;
                    grille.q12av = $('input[name=q12av]:checked').val() ? $('input[name=q12av]:checked').val() : -1;
                    grille.q13av = $('input[name=q13av]:checked').val() ? $('input[name=q13av]:checked').val() : -1;
                    grille.q14av = $('input[name=q14av]:checked').val() ? $('input[name=q14av]:checked').val() : -1;
                    grille.q15av = $('input[name=q15av]:checked').val() ? $('input[name=q15av]:checked').val() : -1;
                    grille.q16av = $('input[name=q16av]:checked').val() ? $('input[name=q16av]:checked').val() : -1;
                    grille.q17av = $('input[name=q17av]:checked').val() ? $('input[name=q17av]:checked').val() : -1;
                    grille.q18av = $('input[name=q18av]:checked').val() ? $('input[name=q18av]:checked').val() : -1;
                    grille.q19av = $('input[name=q19av]:checked').val() ? $('input[name=q19av]:checked').val() : -1;
                    grille.q77av = $('input[name=q77av]:checked').val() ? $('input[name=q77av]:checked').val() : -1;
                    grille.q21av = $('input[name=q21av]:checked').val() ? $('input[name=q21av]:checked').val() : -1;
                    grille.q22av = $('input[name=q22av]:checked').val() ? $('input[name=q22av]:checked').val() : -1;
                    grille.q23av = $('input[name=q23av]:checked').val() ? $('input[name=q23av]:checked').val() : -1;
                    grille.q24av = $('input[name=q24av]:checked').val() ? $('input[name=q24av]:checked').val() : -1;
                    grille.q25av = $('input[name=q25av]:checked').val() ? $('input[name=q25av]:checked').val() : -1;
                    grille.q78av = $('input[name=q78av]:checked').val() ? $('input[name=q78av]:checked').val() : -1;
                    grille.q79av = $('input[name=q79av]:checked').val() ? $('input[name=q79av]:checked').val() : -1;
                    grille.q80av = $('input[name=q80av]:checked').val() ? $('input[name=q80av]:checked').val() : -1;
                    grille.q81av = $('input[name=q81av]:checked').val() ? $('input[name=q81av]:checked').val() : -1;
                    grille.q82av = $('input[name=q82av]:checked').val() ? $('input[name=q82av]:checked').val() : -1;
                    grille.q31av = $('input[name=q31av]:checked').val() ? $('input[name=q31av]:checked').val() : -1;
                    grille.q32av = $('input[name=q32av]:checked').val() ? $('input[name=q32av]:checked').val() : -1;
                    grille.q33av = $('input[name=q33av]:checked').val() ? $('input[name=q33av]:checked').val() : -1;
                    grille.q34av = $('input[name=q34av]:checked').val() ? $('input[name=q34av]:checked').val() : -1;
                    grille.q35av = $('input[name=q35av]:checked').val() ? $('input[name=q35av]:checked').val() : -1;
                    grille.q36av = $('input[name=q36av]:checked').val() ? $('input[name=q36av]:checked').val() : -1;
                    grille.q37av = $('input[name=q37av]:checked').val() ? $('input[name=q37av]:checked').val() : -1;
                    grille.q38av = $('input[name=q38av]:checked').val() ? $('input[name=q38av]:checked').val() : -1;
                    grille.q39av = $('input[name=q39av]:checked').val() ? $('input[name=q39av]:checked').val() : -1;
                    grille.q40av = $('input[name=q40av]:checked').val() ? $('input[name=q40av]:checked').val() : -1;
                    grille.q41av = $('input[name=q41av]:checked').val() ? $('input[name=q41av]:checked').val() : -1;
                    grille.q42av = $('input[name=q42av]:checked').val() ? $('input[name=q42av]:checked').val() : -1;
                    grille.q43av = $('input[name=q43av]:checked').val() ? $('input[name=q43av]:checked').val() : -1;
                    grille.q44av = $('input[name=q44av]:checked').val() ? $('input[name=q44av]:checked').val() : -1;
                    grille.q83av = $('input[name=q83av]:checked').val() ? $('input[name=q83av]:checked').val() : -1;
                    grille.q48av = $('input[name=q48av]:checked').val() ? $('input[name=q48av]:checked').val() : -1;
                    grille.q49av = $('input[name=q49av]:checked').val() ? $('input[name=q49av]:checked').val() : -1;
                    grille.q50av = $('input[name=q50av]:checked').val() ? $('input[name=q50av]:checked').val() : -1;
                    grille.q51av = $('input[name=q51av]:checked').val() ? $('input[name=q51av]:checked').val() : -1;
                    grille.q84av = $('input[name=q84av]:checked').val() ? $('input[name=q84av]:checked').val() : -1;
                    grille.q56av = $('input[name=q56av]:checked').val() ? $('input[name=q56av]:checked').val() : -1;
                    grille.q57av = $('input[name=q57av]:checked').val() ? $('input[name=q57av]:checked').val() : -1;
                    grille.q58av = $('input[name=q58av]:checked').val() ? $('input[name=q58av]:checked').val() : -1;
                    grille.q85av = $('input[name=q85av]:checked').val() ? $('input[name=q85av]:checked').val() : -1;
                    grille.q60av = $('input[name=q60av]:checked').val() ? $('input[name=q60av]:checked').val() : -1;
                    grille.q61av = $('input[name=q61av]:checked').val() ? $('input[name=q61av]:checked').val() : -1;
                    grille.q62av = $('input[name=q62av]:checked').val() ? $('input[name=q62av]:checked').val() : -1;
                    grille.q63av = $('input[name=q63av]:checked').val() ? $('input[name=q63av]:checked').val() : -1;
                    grille.q64av = $('input[name=q64av]:checked').val() ? $('input[name=q64av]:checked').val() : -1;
                    grille.q86av = $('input[name=q86av]:checked').val() ? $('input[name=q86av]:checked').val() : -1;
                    
                    
                    grille.q6 = 1;
                    
                    MM.log('UserGrille:'+usergrille+'Grille:'+grille+'/'+grille.q1);
                    
                    thisuser.save({grille:grille});
                    MM.Router.navigate("eleves/" + course );
                    MM.widgets.dialogClose();
                    grillea6(button,user,course,version);
            
                };
                
                var html3 = "Pour valider, veuillez compléter entièrement la grille de positionnement.";
               
                MM.widgets.dialog2(html3, options3);
                
            } else {
                
                MM.log('Grille Complete');
                if (grille=="") {
                    grille={};
                }
                
                grille.q1av = $('input[name=q1av]:checked').val() ? $('input[name=q1av]:checked').val() : -1;
                grille.q2av = $('input[name=q2av]:checked').val() ? $('input[name=q2av]:checked').val() : -1;
                grille.q3av = $('input[name=q3av]:checked').val() ? $('input[name=q3av]:checked').val() : -1;
                grille.q4av = $('input[name=q4av]:checked').val() ? $('input[name=q4av]:checked').val() : -1;
                grille.q5av = $('input[name=q5av]:checked').val() ? $('input[name=q5av]:checked').val() : -1;
                grille.q6av = $('input[name=q6av]:checked').val() ? $('input[name=q6av]:checked').val() : -1;
                grille.q7av = $('input[name=q7av]:checked').val() ? $('input[name=q7av]:checked').val() : -1;
                grille.q8av = $('input[name=q8av]:checked').val() ? $('input[name=q8av]:checked').val() : -1;
                grille.q9av = $('input[name=q9av]:checked').val() ? $('input[name=q9av]:checked').val() : -1;
                grille.q10av = $('input[name=q10av]:checked').val() ? $('input[name=q10av]:checked').val() : -1;
                grille.q11av = $('input[name=q11av]:checked').val() ? $('input[name=q11av]:checked').val() : -1;
                grille.q12av = $('input[name=q12av]:checked').val() ? $('input[name=q12av]:checked').val() : -1;
                grille.q13av = $('input[name=q13av]:checked').val() ? $('input[name=q13av]:checked').val() : -1;
                grille.q14av = $('input[name=q14av]:checked').val() ? $('input[name=q14av]:checked').val() : -1;
                grille.q15av = $('input[name=q15av]:checked').val() ? $('input[name=q15av]:checked').val() : -1;
                grille.q16av = $('input[name=q16av]:checked').val() ? $('input[name=q16av]:checked').val() : -1;
                grille.q17av = $('input[name=q17av]:checked').val() ? $('input[name=q17av]:checked').val() : -1;
                grille.q18av = $('input[name=q18av]:checked').val() ? $('input[name=q18av]:checked').val() : -1;
                grille.q19av = $('input[name=q19av]:checked').val() ? $('input[name=q19av]:checked').val() : -1;
                grille.q77av = $('input[name=q77av]:checked').val() ? $('input[name=q77av]:checked').val() : -1;
                grille.q21av = $('input[name=q21av]:checked').val() ? $('input[name=q21av]:checked').val() : -1;
                grille.q22av = $('input[name=q22av]:checked').val() ? $('input[name=q22av]:checked').val() : -1;
                grille.q23av = $('input[name=q23av]:checked').val() ? $('input[name=q23av]:checked').val() : -1;
                grille.q24av = $('input[name=q24av]:checked').val() ? $('input[name=q24av]:checked').val() : -1;
                grille.q25av = $('input[name=q25av]:checked').val() ? $('input[name=q25av]:checked').val() : -1;
                grille.q78av = $('input[name=q78av]:checked').val() ? $('input[name=q78av]:checked').val() : -1;
                grille.q79av = $('input[name=q79av]:checked').val() ? $('input[name=q79av]:checked').val() : -1;
                grille.q80av = $('input[name=q80av]:checked').val() ? $('input[name=q80av]:checked').val() : -1;
                grille.q81av = $('input[name=q81av]:checked').val() ? $('input[name=q81av]:checked').val() : -1;
                grille.q82av = $('input[name=q82av]:checked').val() ? $('input[name=q82av]:checked').val() : -1;
                grille.q31av = $('input[name=q31av]:checked').val() ? $('input[name=q31av]:checked').val() : -1;
                grille.q32av = $('input[name=q32av]:checked').val() ? $('input[name=q32av]:checked').val() : -1;
                grille.q33av = $('input[name=q33av]:checked').val() ? $('input[name=q33av]:checked').val() : -1;
                grille.q34av = $('input[name=q34av]:checked').val() ? $('input[name=q34av]:checked').val() : -1;
                grille.q35av = $('input[name=q35av]:checked').val() ? $('input[name=q35av]:checked').val() : -1;
                grille.q36av = $('input[name=q36av]:checked').val() ? $('input[name=q36av]:checked').val() : -1;
                grille.q37av = $('input[name=q37av]:checked').val() ? $('input[name=q37av]:checked').val() : -1;
                grille.q38av = $('input[name=q38av]:checked').val() ? $('input[name=q38av]:checked').val() : -1;
                grille.q39av = $('input[name=q39av]:checked').val() ? $('input[name=q39av]:checked').val() : -1;
                grille.q40av = $('input[name=q40av]:checked').val() ? $('input[name=q40av]:checked').val() : -1;
                grille.q41av = $('input[name=q41av]:checked').val() ? $('input[name=q41av]:checked').val() : -1;
                grille.q42av = $('input[name=q42av]:checked').val() ? $('input[name=q42av]:checked').val() : -1;
                grille.q43av = $('input[name=q43av]:checked').val() ? $('input[name=q43av]:checked').val() : -1;
                grille.q44av = $('input[name=q44av]:checked').val() ? $('input[name=q44av]:checked').val() : -1;
                grille.q83av = $('input[name=q83av]:checked').val() ? $('input[name=q83av]:checked').val() : -1;
                grille.q48av = $('input[name=q48av]:checked').val() ? $('input[name=q48av]:checked').val() : -1;
                grille.q49av = $('input[name=q49av]:checked').val() ? $('input[name=q49av]:checked').val() : -1;
                grille.q50av = $('input[name=q50av]:checked').val() ? $('input[name=q50av]:checked').val() : -1;
                grille.q51av = $('input[name=q51av]:checked').val() ? $('input[name=q51av]:checked').val() : -1;
                grille.q84av = $('input[name=q84av]:checked').val() ? $('input[name=q84av]:checked').val() : -1;
                grille.q56av = $('input[name=q56av]:checked').val() ? $('input[name=q56av]:checked').val() : -1;
                grille.q57av = $('input[name=q57av]:checked').val() ? $('input[name=q57av]:checked').val() : -1;
                grille.q58av = $('input[name=q58av]:checked').val() ? $('input[name=q58av]:checked').val() : -1;
                grille.q85av = $('input[name=q85av]:checked').val() ? $('input[name=q85av]:checked').val() : -1;
                grille.q60av = $('input[name=q60av]:checked').val() ? $('input[name=q60av]:checked').val() : -1;
                grille.q61av = $('input[name=q61av]:checked').val() ? $('input[name=q61av]:checked').val() : -1;
                grille.q62av = $('input[name=q62av]:checked').val() ? $('input[name=q62av]:checked').val() : -1;
                grille.q63av = $('input[name=q63av]:checked').val() ? $('input[name=q63av]:checked').val() : -1;
                grille.q64av = $('input[name=q64av]:checked').val() ? $('input[name=q64av]:checked').val() : -1;
                grille.q86av = $('input[name=q86av]:checked').val() ? $('input[name=q86av]:checked').val() : -1;
                
                
                grille.q6 = 2;
                
                //MM.log('Grille:'+grille+'/'+grille.q4);
                
                var options4= {
                    title: '',
                    buttons: {}
                };
                options4.buttons["Annuler"] = function() {
                    MM.widgets.dialogClose2();
                };
                
                options4.buttons["Je valide"] = function() {
                    MM.log('Enregistrer et Valider Grille 1A');
                    thisuser.save({grille:grille});
                    //$('button#creerpif[user="'+user+'"]').replaceWith('<button onclick="clickPif($(this),$(this).attr(\'course\'),$(this).attr(\'user\'),$(this).attr(\'version\'),$(this).attr(\'pif\'))" class="btn grd-grisfonce text-blanc" id="pif" pif="" course="'+course+'" version="1" user="'+user+'" path="" module="" class="btn grd-grisfonce text-rouge">PIF</button>');
                    //$('button#creerpif[user="'+user+'"]').unbind('click');
                    //$('button#creerpif[user="'+user+'"]').attr('id','pif');
                    //$('button#pif[user="'+user+'"]').html('PIF');
                    //$('button#pif[user="'+user+'"]').attr('class','btn grd-grisfonce text-blanc');
                    
                    MM.Router.navigate("eleves/" + course, {trigger: true} );
                    
                    MM.widgets.dialogClose2();
                    MM.widgets.dialogClose();
                    aval($('button#pif[user="'+user+'"]'),user,course,version);
                    
                };
                
                var html4 = "En validant la grille, vous mettrez à jour le Protocole de Formation (PIF) de votre stagiaire.<br/>Vos réponses ne pourront plus etre modifiées.";
               
                MM.widgets.dialog2(html4, options4);
                
                
                
            }
            
        };
        options2.buttons["Valider la grille"]["style"] = "modal-button-7";
    }
    
    $("#app-dialog").addClass('full-screen-dialog2');
    $("#app-dialog .modalContent").css('height','85vh');
    MM.widgets.dialog(html, options2);
    //document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";
    document.getElementById("pifContent").style.height = (window.innerHeight - 134) + "px";
    document.getElementById("pifContent").style.maxHeight = (window.innerHeight - 134) + "px";
    document.getElementById("secondblock").style.height = (window.innerHeight - 284) + "px";

    $("tr#title").each(function( index ) {
        $(this).on(MM.clickType, function(e) {
            var mytr = $(this);
            if ($(this).attr('opened') == 0) {
                $(this).nextUntil( $('tr.title'), "tr" ).show();
                $(this).attr('opened',1);
                
                $( "tr#title" ).each(function( index2 ) {
                  if ($(this).is(mytr)) {
                  } else {
                    $(this).nextUntil( $('tr#title'), "tr" ).hide();
                    $(this).attr('opened',0);
                  }
                });
            } else {
                $(this).nextUntil( $('tr#title'), "tr" ).hide();
                $(this).attr('opened',0);
                $( "tr#title" ).each(function( index3 ) {
                  if ($(this).is(mytr)) {
                  } else {
                     $(this).nextUntil( $('tr#title'), "tr" ).hide();
                     $(this).attr('opened',0);
                  }
                  
                });
            }
        });
        
        if ($(this).attr('opened') == 1) {
            $(this).nextUntil( $('tr.title'), "tr" ).show();
        }
        
        if ($(this).attr('opened') == 0) {
            $(this).nextUntil( $('tr#title'), "tr" ).hide();
        }
    });
    
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
    var theuser = MM.db.get("users", MM.config.current_site.id + "-" + parseInt(user));
    MM.log('pif:'+course+'/'+user+'/'+version);
    
    var userspif = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
    var userpif = userspif[0].toJSON();
    var pifs = userpif.pif;
    var grille = userpif.grille;
    pifscourse = $.grep(pifs, function( el ) {
                    return el.courseid == course;
    });
    MM.log('pifscourse length:'+pifscourse.length);
    
    MM.log('pifs:'+pifs);
    var test1 = $('button#creerpif[user="'+userpif.userid+'"]').attr('pif');
    var test2 = $('button#pif[user="'+userpif.userid+'"]').attr('pif');
    //var test3 = $('button#modifierpif[user="'+userpif.userid+'"]').attr('pif');
    MM.log('test1:'+test1);
    MM.log('test2:'+test2);
    MM.log('test3:'+test2);
    
    var pifArray = pifs;
    
    
    
    /*
    if (pifs == "" || pifs == "[]")
        var pifArray = $('button#creerpif[user="'+userpif.userid+'"]').attr('pif');
    else
        pifArray = $('button#pif[user="'+userpif.userid+'"]').attr('pif');
    */
    
    MM.log('pifArray:'+pifArray);
    
    
    if (pifArray != "" && pifArray != "[]" && pifArray != undefined){
        pifArray = JSON.stringify(pifs);
        pifArray = pifArray.replace(/\\"/g, '"');
    }
    
    MM.log('pifArray:'+pifArray);
    
    
    if (pifArray == "" || pifArray == "[]" || pifArray == undefined) {
        if (pifscourse.length > 0) {
            var managerid = pifscourse[0].managerid;
            var managername = pifscourse[0].managername;
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
    
    //MM.log(thisuser);
    
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
    
    if ((grille == "" || grille == "[]" )) {
        MM.log('User without Grille:');
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
        
    } else {
        MM.log('User with Grille:');
        for (var key in grille) {
            MM.log(key+':'+grille[key]);
        }
        var indexcontent = 1;
        
        local_contents.forEach(function(local_content) {
             var content = local_content.toJSON();
             var unchecked = 0;
             var unckeckednoteam = 0;
             var unckeckednoteav = 0;
             var note = 0;
             
             MM.log('indexContent:'+indexcontent);
             
            if (content.modname == "scorm") {
                if (indexcontent == 1) {
                    note =  (parseInt(grille.q5am) + parseInt(grille.q6am) + parseInt(grille.q7am) + parseInt(grille.q8am) + parseInt(grille.q9am));
                    if (note <= 8) {
                        unckeckednoteam = 1;
                    }
                    MM.log('Note Module 1:'+note);
                }
                if (indexcontent == 1) {
                    note =  parseInt(grille.q20av) + (parseInt(grille.q26av) + parseInt(grille.q27av) + parseInt(grille.q28av) +parseInt(grille.q29av) +parseInt(grille.q30av))/5 + (parseInt(grille.q45av) + parseInt(grille.q46av) + parseInt(grille.q47av))/3 + (parseInt(grille.q52av) + parseInt(grille.q53av) + parseInt(grille.q54av) + parseInt(grille.q55av))/4 + parseInt(grille.q59av) + parseInt(grille.q65av);
                    if (note >= 9) {
                        unckeckednoteav = 1;
                    }
                    MM.log('Note Module 1v:'+note);
                }
                
                if (indexcontent == 2) {
                    note =  (parseInt(grille.q11am) + parseInt(grille.q12am) + parseInt(grille.q13am) + parseInt(grille.q14am) + parseInt(grille.q15am));
                    if (note <= 8) {
                        unckeckednoteam = 1;
                    }
                    MM.log('Note Module 2:'+note);
                }
                if (indexcontent == 2) {
                    note =  parseInt(grille.q66av) + (parseInt(grille.q67av) + parseInt(grille.q68av) + parseInt(grille.q69av) +parseInt(grille.q70av) +parseInt(grille.q71av))/5 + parseInt(grille.q72av) + (parseInt(grille.q73av) + parseInt(grille.q74av))/2 + parseInt(grille.q75av) + parseInt(grille.q76av);
                    if (note >= 9) {
                        unckeckednoteav = 1;
                    }
                    MM.log('Note Module 2v:'+note);
                }
                
                if (indexcontent == 3) {
                    note =  (parseInt(grille.q16am) + parseInt(grille.q17am) + parseInt(grille.q18am) + parseInt(grille.q19am) + parseInt(grille.q20am));
                    if (note <= 8) {
                        unckeckednoteam = 1;
                    }
                    MM.log('Note Module 3:'+note);
                }
                if (indexcontent == 3) {
                    note =  parseInt(grille.q77av) + (parseInt(grille.q78av) + parseInt(grille.q79av) + parseInt(grille.q80av) +parseInt(grille.q81av) +parseInt(grille.q82av))/5 + parseInt(grille.q83av) + parseInt(grille.q84av) + parseInt(grille.q85av) + parseInt(grille.q86av);
                    if (note >= 9) {
                        unckeckednoteav = 1;
                    }
                    MM.log('Note Module 3v:'+note);
                }
                
                if (indexcontent == 4) {
                    note =  (parseInt(grille.q1am) + parseInt(grille.q4am));
                    if (note <= 3.2) {
                        unckeckednoteam = 1;
                    }
                    MM.log('Note Module 4:'+note);
                }
                if (indexcontent == 4) {
                    note =  (parseInt(grille.q1av) + parseInt(grille.q2av) + parseInt(grille.q3av) + parseInt(grille.q4av))/4 + (parseInt(grille.q11av) + parseInt(grille.q12av) + parseInt(grille.q13av) + parseInt(grille.q14av) + parseInt(grille.q15av))/5;
                    if (note >= 3) {
                        unckeckednoteav = 1;
                    }
                    MM.log('Note Module 4v:'+note);
                }
                
                
                if (indexcontent == 5) {
                    note =  parseInt(grille.q1am) + (parseInt(grille.q5am) +  parseInt(grille.q11am) + parseInt(grille.q16am))/3 + (parseInt(grille.q7am) +  parseInt(grille.q13am )+ parseInt(grille.q18am))/3;
                    if (note <= 4.8) {
                        unckeckednoteam = 1;
                    }
                    MM.log('Note Module 5:'+note);
                }
                if (indexcontent == 5) {
                    note =  (parseInt(grille.q1av) + parseInt(grille.q2av) + parseInt(grille.q3av) + parseInt(grille.q4av))/4 + (parseInt(grille.q16av) + parseInt(grille.q17av) + parseInt(grille.q18av) + parseInt(grille.q19av))/4 + (parseInt(grille.q31av) + parseInt(grille.q32av) + parseInt(grille.q33av) + parseInt(grille.q34av) + parseInt(grille.q35av) + parseInt(grille.q36av) + parseInt(grille.q37av) + parseInt(grille.q38av) + parseInt(grille.q39av) + parseInt(grille.q40av) + parseInt(grille.q41av) + parseInt(grille.q42av) + parseInt(grille.q43av) + parseInt(grille.q44av))/14;
                    if (note >= 4.5) {
                        unckeckednoteav = 1;
                    }
                    MM.log('Note Module 5v:'+note);
                }
                
                if (indexcontent == 6) {
                    note =  (parseInt(grille.q6am) +  parseInt(grille.q12am) + parseInt(grille.q17am))/3 + (parseInt(grille.q7am) + parseInt(grille.q13am) + parseInt(grille.q18am))/3;
                    if (note <= 3.2) {
                        unckeckednoteam = 1;
                    }
                    MM.log('Note Module 6:'+note);
                }
                if (indexcontent == 6) {
                    note =  (parseInt(grille.q21av) + parseInt(grille.q22av) + parseInt(grille.q23av) + parseInt(grille.q24av)+ parseInt(grille.q25av))/5 + (parseInt(grille.q31av) + parseInt(grille.q32av) + parseInt(grille.q33av) + parseInt(grille.q34av)+ parseInt(grille.q35av) + parseInt(grille.q36av) + parseInt(grille.q37av) + parseInt(grille.q38av) + parseInt(grille.q39av)+ parseInt(grille.q40av) + parseInt(grille.q41av) + parseInt(grille.q42av) + parseInt(grille.q43av) + parseInt(grille.q44av))/14;
                    if (note >= 3) {
                        unckeckednoteav = 1;
                    }
                    MM.log('Note Module 6v:'+note);
                }
                
                if (indexcontent == 7) {
                    note =  (parseInt(grille.q7am) +  parseInt(grille.q13am) + parseInt(grille.q18am))/3 + (parseInt(grille.q9am) +  parseInt(grille.q15am) + parseInt(grille.q20am))/3 + parseInt(grille.q10am);
                    if (note <= 4.8) {
                        unckeckednoteam = 1;
                    }
                    MM.log('Note Module 7:'+note);
                }
                if (indexcontent == 7) {
                    note =  (parseInt(grille.q56av) +  parseInt(grille.q57av) + parseInt(grille.q58av))/3 + (parseInt(grille.q31av) + parseInt(grille.q32av) + parseInt(grille.q33av) + parseInt(grille.q34av)+ parseInt(grille.q35av) + parseInt(grille.q36av) + parseInt(grille.q37av) + parseInt(grille.q38av) + parseInt(grille.q39av)+ parseInt(grille.q40av) + parseInt(grille.q41av) + parseInt(grille.q42av) + parseInt(grille.q43av) + parseInt(grille.q44av))/14 + (parseInt(grille.q60av) + parseInt(grille.q61av) + parseInt(grille.q62av) + parseInt(grille.q63av)+ parseInt(grille.q64av))/5;
                    if (note >= 4.5) {
                        unckeckednoteav = 1;
                    }
                    MM.log('Note Module 7v:'+note);
                }
                
                if (indexcontent == 8) {
                    note =  (parseInt(grille.q5am) +  parseInt(grille.q11am) + parseInt(grille.q16am))/3 + (parseInt(grille.q6am) +  parseInt(grille.q12am) + parseInt(grille.q17am))/3 + parseInt(grille.q10am);
                    if (note <= 4.8) {
                        unckeckednoteam = 1;
                    }
                    MM.log('Note Module 8:'+note);
                }
                if (indexcontent == 8) {
                    note =  (parseInt(grille.q16av) + parseInt(grille.q17av) + parseInt(grille.q18av) + parseInt(grille.q19av))/4 + (parseInt(grille.q21av) + parseInt(grille.q22av) + parseInt(grille.q23av) + parseInt(grille.q24av)+ parseInt(grille.q25av))/5 + (parseInt(grille.q60av) + parseInt(grille.q61av) + parseInt(grille.q62av) + parseInt(grille.q63av)+ parseInt(grille.q64av))/5;
                    if (note >= 4.5) {
                        unckeckednoteav = 1;
                    }
                    MM.log('Note Module 8v:'+note);
                }
                
                if (indexcontent == 9) {
                    note =  (parseInt(grille.q8am) +  parseInt(grille.q14am) + parseInt(grille.q19am))/3 + parseInt(grille.q2am) + parseInt(grille.q3am);
                    if (note <= 4.8) {
                        unckeckednoteam = 1;
                    }
                    MM.log('Note Module 9:'+note);
                }
                if (indexcontent == 9) {
                    note =  (parseInt(grille.q5av) + parseInt(grille.q6av) + parseInt(grille.q7av) + parseInt(grille.q8av))/4 + (parseInt(grille.q9av) + parseInt(grille.q10av))/2 + (parseInt(grille.q48av) + parseInt(grille.q49av) + parseInt(grille.q50av) + parseInt(grille.q51av))/4;
                    if (note >= 4.5) {
                        unckeckednoteav = 1;
                    }
                    MM.log('Note Module 9v:'+note);
                }
                
                html+='<tr><td style="height:40px" class="center2"><input onclick="checkthispif(this)" type="checkbox" id="checkboxpif" genre="b" content="'+content.contentid+'" name="b_'+content.contentid+'"';
                
                MM.log('CHECKPIF:'+pifArray+'/'+unckeckednoteam)
                if (pifArray == "") {
                
                    //MM.log('pifscourse:'+pifscourse+'/'+pifscourse.length+'/'+pifscourse[0]+'/'+pifscourse[0].scormid);
                    if (pifscourse.length > 0) {
                        pifscormb = $.grep(pifscourse, function( el ) {
                            return el.scormid == content.contentid && el.begin == 1;
                        });
                        MM.log('pifscormb length:'+pifscormb.length);
                        
                    } else {
                        pifscormb = [];
                    }
                    
                    if (pifscormb.length>0) {
                            html+=' checked="checked"';
                            total_duration += content.pif_duration;
                    } else {
                        if (unckeckednoteam) {
                            html+=' checked="checked" disabled="true"';
                            total_duration += content.pif_duration;
                        }   
                    }
                    
                    
                    
                    html +='></td><td  class="center2">'+content.name+'</td><td  class="center2"><input id="checkboxpif" genre="a" content="'+content.contentid+'" type="checkbox" name="a_'+content.contentid+'"';
                     
                    pifscorme = $.grep(pifscourse, function( el ) {
                            return el.scormid == content.contentid && el.end == 1;
                    });
                    MM.log('pifscorme length:'+pifscorme.length);
                    
                    if (unckeckednoteav) {
                        html+=' checked="checked" disabled="true"';
                    } else {
                        if (pifscorme.length>0) {
                            html+=' checked="checked" disabled="true" ';
                        }
                        else {
                            html+=' disabled="true"'
                        }
                    }
                    
                    
                    html +='></td></tr>';
                    
                } else {
                    
                    
                    //MM.log('PIF Button Attr:'+pifArray2+'/'+pifArray2.length+'/'+pifArray2[0]+'/'+pifArray2[0].scormid+'/'+content.contentid);
                    
                    pifscormb = $.grep(pifArray2, function( el ) {
                        return el.scormid == content.contentid && el.begin == 1;
                    });
                    
                    
                    if (unckeckednoteam) {
                        html+=' checked="checked" disabled="true"';
                        total_duration += content.pif_duration;
                    } else {
                        if (pifscormb.length>0) {
                            html+=' checked="checked"';
                            total_duration += content.pif_duration;
                        } else {
                            unchecked = 1;
                        }
                    }
                    
                    html +='></td><td  class="center2">'+content.name+'</td><td  class="center2"><input id="checkboxpif" genre="a" content="'+content.contentid+'" type="checkbox" name="a_'+content.contentid+'"';
                     
                    pifscorme = $.grep(pifArray2, function( el ) {
                            return el.scormid == content.contentid && el.end == 1;
                    });
                    
                    MM.log ('GLOUP:'+unckeckednoteav+"/"+pifscorme.length);
                    
                    if (unckeckednoteav) {
                        html+=' checked="checked" disabled="true"';
                    } else {
                        if (pifscorme.length>0) {
                            html+=' checked="checked" disabled="true" ';
                        }
                        else {
                        //if (unchecked) {
                            html+=' disabled="true"'
                        }
                    }
                    
                    
                    html +='></td></tr>';
                    
                }
                
                indexcontent=indexcontent+1;
                
            }
        });
        
    }
    
    html +='</table><br/><br/>';
    
    
    if (pifArray != ""){
        $('button#pif[user="'+userpif.userid+'"]').attr("pif","");
        $('button#creerpif[user="'+userpif.userid+'"]').attr("pif","");
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
        marginTop: "5%",
        buttons: {}
    };
    
    options.buttons[MM.lang.s("cancel")] = function() {
        MM.Router.navigate("eleves/" + course );
        //$("#app-dialog").removeClass('full-screen-dialog2');
        MM.widgets.dialogClose();
        clickPif(button,course,user,version,'');
        
    };
    
    
    
    if (version == 1 && (grille == "" || grille == "[]" )) {

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
                html += '<tr><td class="center2" id="pifsignature1"><img src="'+ path +'" width="300"><input type="hidden" name="pifsignature1" value="'+fileSignature1+'"></td>';
                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                MM.fs.findFileAndReadContents(fileSignature2,
                    function(path) {
                        pifsignature2 = path;
                        MM.log('Image Signature Stagiaire avant OK 1:'+fileSignature2);
                        html += '<td class="center2" id="pifsignature1"><img src="'+ path +'" width="300"><input type="hidden" name="pifsignature2" value="'+fileSignature2+'"></td></tr>';
                        html += '</table><br/><br/>';
                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center" colspan="2"><b>APRES LA FORMATION<br/>Signer pour valider les compétences acquises</b></th></tr>';
                        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';
                                        
                        MM.fs.findFileAndReadContents(fileSignature3,
                            function(path) {
                                pifsignature3 = path;
                                MM.log('Image Signature Manager aprés OK 1:'+fileSignature3);
                                html += '<tr><td class="center2" id="pifsignature3"><img src="'+ path +'" width="300"><input type="hidden" name="pifsignature3"" value="'+fileSignature3+'"></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK 1:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><img src="'+ path +'" width="300"><input type="hidden" name="pifsignature4"" value="'+fileSignature4+'"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                        
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK 1:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="0"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                        
                                    }
                                );
                            },
                            function(path) {
                                MM.log('Image Signature Manager aprés NOK 1:'+fileSignature3);
                                html += '<tr><td class="center2" id="pifsignature3"><input type="hidden" name="pifsignature3" value="0"><button course="'+courseId+'" id="signature_manager_apres" name="signature" userid="'+user+'" version="'+version+'"managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK 1:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="'+fileSignature4+'"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                        
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK 1:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="0"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                        
                                    }
                                );
                            }
                        );
                
                    },
                    function(path) {
                        MM.log('Image Signature Stagiaire avant NOK 1:'+fileSignature2);
                        html += '<td class="center2" id="pifsignature2"><input type="hidden" name="pifsignature2" value="0"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" managerid="'+managerid+'" version="'+version+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                        html += '</table><br/><br/>';
                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center" colspan="2"><b>APRES LA FORMATION<br/>Signer pour valider les compétences acquises</b></th></tr>';
                        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';
                        
                        MM.fs.findFileAndReadContents(fileSignature3,
                            function(path) {
                                pifsignature3 = path;
                                MM.log('Image Signature Manager aprés OK:'+fileSignature3);
                                html += '<tr><td class="center2" id="pifsignature3"><input type="hidden" name="pifsignature3" value="'+fileSignature3+'"><img src="'+ path +'" width="300"></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="'+fileSignature4+'"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                       
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="0"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                        
                                    }
                                );
                            },
                            function(path) {
                                MM.log('Image Signature Manager aprés NOK:'+fileSignature3);
                                html += '<tr><td class="center2" id="pifsignature3"><input type="hidden" name="pifsignature3" value="0"><button course="'+courseId+'" id="signature_manager_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" version="'+version+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="'+fileSignature4+'"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 70)/100) + "px"; 
                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="0"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 70)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                    }
                                );
                            }
                        );
                    }
                );
            },
            function(path) {
                MM.log('Image Signature Manager avant NOK:'+fileSignature1);
                html += '<tr><td class="center2" id="pifsignature1"><input type="hidden" name="pifsignature1" value="0"><button course="'+courseId+'" id="signature_manager_avant" name="signature" userid="'+user+'" managerid="'+managerid+'" version="'+version+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
        
                MM.fs.findFileAndReadContents(fileSignature2,
                    function(path) {
                        pifsignature2 = path;
                        MM.log('Image Signature Stagiaire avant OK 2:'+fileSignature2);
                        html += '<td class="center2" id="pifsignature2"><input type="hidden" name="pifsignature2" value="'+fileSignature2+'"><img src="'+ path +'" width="300"></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        html += '</table><br/><br/>';
                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center" colspan="2"><b>APRES LA FORMATION<br/>Signer pour valider les compétences acquises</b></th></tr>';
                        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';
                        
                        MM.fs.findFileAndReadContents(fileSignature3,
                            function(path) {
                                pifsignature3 = path;
                                MM.log('Image Signature Manager aprés OK:'+fileSignature3);
                                html += '<tr><td class="center2" id="pifsignature3"><input type="hidden" name="pifsignature3" value="'+fileSignature3+'"><img src="'+ path +'" width="300"></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="'+fileSignature4+'"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="0"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                        
                                    }
                                );
                            },
                            function(path) {
                                MM.log('Image Signature Manager aprés NOK:'+fileSignature3);
                                html += '<tr><td class="center2" id="pifsignature3"><input type="hidden" name="pifsignature3" value="0"><button course="'+courseId+'" id="signature_manager_apres" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="'+fileSignature4+'"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="0"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                    }
                                );
                            }
                        );
                    },
                    function(path) {
                        MM.log('Image Signature Stagiaire avant NOK 2:'+fileSignature2);
                        html += '<td class="center2" id="pifsignature2"><input type="hidden" name="pifsignature2" value="0"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" managerid="'+managerid+'" version="'+version+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        html += '</table><br/><br/>';
                        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center" colspan="2"><b>APRES LA FORMATION<br/>Signer pour valider les compétences acquises</b></th></tr>';
                        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';              
                    
                        MM.fs.findFileAndReadContents(fileSignature3,
                            function(path) {
                                pifsignature3 = path;
                                MM.log('Image Signature Manager aprés OK:'+fileSignature3);
                                html += '<tr><td class="center2" id="pifsignature3"><input type="hidden" name="pifsignature3" value="'+fileSignature3+'"><img src="'+ path +'" width="300"></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="'+fileSignature4+'"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="0"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                        
                                    }
                                );
                            },
                            function(path) {
                                MM.log('Image Signature Manager aprés NOK:'+fileSignature3);
                                html += '<tr><td class="center2" id="pifsignature3"><input type="hidden" name="pifsignature3" value="0"><button course="'+courseId+'" id="signature_manager_apres" name="signature" userid="'+user+'" managerid="'+managerid+'" version="'+version+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        
                                MM.fs.findFileAndReadContents(fileSignature4,
                                    function(path) {
                                        pifsignature4 = path;
                                        MM.log('Image Signature Stagiaire aprés OK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="'+fileSignature4+'"><img src="'+ path +'" width="300"></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                    },
                                    function(path) {
                                        MM.log('Image Signature Stagiaire aprés NOK:'+fileSignature4);
                                        html += '<td class="center2" id="pifsignature4"><input type="hidden" name="pifsignature4" value="0"><button course="'+courseId+'" id="signature_stagiaire_apres" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                                
                                        html += '</table></div>';
                                        
                                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                                        options.buttons["Valider"]["style"] = "modal-button-2";
                                        
                                        $("#app-dialog").addClass('full-screen-dialog2');
                                        $("#app-dialog .modalContent").css('height','85vh');
                                        MM.widgets.dialog(html, options);
                                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                                        if (pifArray != "") {
                                            window.setTimeout(function() {
                                                    var elem = document.getElementById('pifContent');
                                                    elem.scrollTop = elem.scrollHeight;
                                            }, 500);
                                        }
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    
    }
    
    if (version == 1 && (grille != "" && grille != "[]" )) {

        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><th class="center" colspan="2"><b>Signer pour valider les compétences à développer dans le cadre du parcours de formation</b></th></tr>';
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
                html += '<tr><td class="center2" id="pifsignature1"><img src="'+ path +'" width="300"><input type="hidden" name="pifsignature1" value="'+fileSignature1+'"></td>';
                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                MM.fs.findFileAndReadContents(fileSignature2,
                    function(path) {
                        pifsignature2 = path;
                        MM.log('Image Signature Stagiaire avant OK 1:'+fileSignature2);
                        html += '<td class="center2" id="pifsignature2"><img src="'+ path +'" width="300"><input type="hidden" name="pifsignature2" value="'+fileSignature2+'"></td></tr>';
                        html += '</table></div>';
                                        
                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                        options.buttons["Valider"]["style"] = "modal-button-2";
                        
                        $("#app-dialog").addClass('full-screen-dialog2');
                        $("#app-dialog .modalContent").css('height','85vh');
                        MM.widgets.dialog(html, options);
                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                        if (pifArray != "") {
                            window.setTimeout(function() {
                                    var elem = document.getElementById('pifContent');
                                    elem.scrollTop = elem.scrollHeight;
                            }, 500);
                        }
                
                    },
                    function(path) {
                        MM.log('Image Signature Stagiaire avant NOK 1:'+fileSignature2);
                        html += '<td class="center2" id="pifsignature2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" managerid="'+managerid+'" version="'+version+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button><input type="hidden" name="pifsignature2" value="0"></td></tr>';
                        html += '</table></div>';
                                        
                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                        options.buttons["Valider"]["style"] = "modal-button-2";
                        
                        $("#app-dialog").addClass('full-screen-dialog2');
                        $("#app-dialog .modalContent").css('height','85vh');
                        MM.widgets.dialog(html, options);
                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                        if (pifArray != "") {
                            window.setTimeout(function() {
                                    var elem = document.getElementById('pifContent');
                                    elem.scrollTop = elem.scrollHeight;
                            }, 500);
                        }
                        
                    }
                );
            },
            function(path) {
                MM.log('Image Signature Manager avant NOK:'+fileSignature1);
                html += '<tr><td class="center2" id="pifsignature1"><input type="hidden" name="pifsignature1" value="0"><button course="'+courseId+'" id="signature_manager_avant" name="signature" userid="'+user+'" managerid="'+managerid+'" version="'+version+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
        
                MM.fs.findFileAndReadContents(fileSignature2,
                    function(path) {
                        pifsignature2 = path;
                        MM.log('Image Signature Stagiaire avant OK 2:'+fileSignature2);
                        html += '<td class="center2" id="pifsignature2"><input type="hidden" name="pifsignature2" value="'+fileSignature2+'"><img src="'+ path +'" width="300"></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        html += '</table></div>';
                                        
                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                        options.buttons["Valider"]["style"] = "modal-button-2";
                        
                        $("#app-dialog").addClass('full-screen-dialog2');
                        $("#app-dialog .modalContent").css('height','85vh');
                        MM.widgets.dialog(html, options);
                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                        if (pifArray != "") {
                            window.setTimeout(function() {
                                    var elem = document.getElementById('pifContent');
                                    elem.scrollTop = elem.scrollHeight;
                            }, 500);
                        }
                        
                    },
                    function(path) {
                        MM.log('Image Signature Stagiaire avant NOK 2:'+fileSignature2);
                        html += '<td class="center2" id="pifsignature2"><input type="hidden" name="pifsignature2" value="0"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" managerid="'+managerid+'" version="'+version+'" managername="'+managername+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                        html += '</table></div>';
                                        
                        options.buttons["Valider"] = function() { validerPif(userspif,pifs,course,thisuser,$("input[name='pifsignature1']").val(),$("input[name='pifsignature2']").val(),$("input[name='pifsignature3']").val(),$("input[name='pifsignature4']").val(),managerid,managername,version,today); };
                        options.buttons["Valider"]["style"] = "modal-button-2";
                        
                        $("#app-dialog").addClass('full-screen-dialog2');
                        $("#app-dialog .modalContent").css('height','85vh');
                        MM.widgets.dialog(html, options);
                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                        if (pifArray != "") {
                            window.setTimeout(function() {
                                    var elem = document.getElementById('pifContent');
                                    elem.scrollTop = elem.scrollHeight;
                            }, 500);
                        }
                        
                    }
                );
            }
        );
    
    }
    
    if (version > 1) {
        
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

        html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo"><tr><td class="center2" colspan="2"><b>AVENANT</b><br/><br/>Je certifie vouloir apporter ces dernières modifications à l\'article 3 du Protocole Individuel de Formation (PIF) bipartite et que le stagiaire bénéficiaire en a bien pris connaissance.<br/><br/>Modifié le '+current+'<br/><br/><br/></td></tr><tr><th class="center" colspan="2"><b>Signez pour valider les modifications apportées au PIF</b></th></tr>';
        html += '<tr><td class="center2"><b>Le manager</b></td><td class="center2"><b>Le stagiaire</b></td></tr>';
        
        var fileAvenant1 = MM.config.current_site.id+"/"+course+"/"+user+"_"+version+"_signature_manager.png";
        var fileAvenant2 = MM.config.current_site.id+"/"+course+"/"+user+"_"+version+"_signature_stagiaire.png";
        
        MM.fs.findFileAndReadContents(fileAvenant1,
            function(path) {
                avenantsignature1 = path;
                MM.log('Image Signature Manager Avenant OK Version :'+version+' : '+fileAvenant1);
                html += '<tr><td class="center2" id="avenantsignature1"><input type="hidden" name="avenantsignature1" value="'+fileAvenant1+'"><img src="'+ path +'" width="300"></td>';
                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
        
                MM.fs.findFileAndReadContents(fileAvenant2,
                    function(path) {
                        avenantsignature2 = path;
                        MM.log('Image Signature Stagiaire Avenant OK Version :'+version+' : '+fileAvenant2);
                        html += '<td class="center2" id="avenantsignature2"><input type="hidden" name="avenantsignature2" value="'+fileAvenant2+'"><img src="'+ path +'" width="300"></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                        html += '</table></div>';
                        
                        options.buttons["Valider les modifications"] = function() { validerAvenant(userspif,pifs,course,thisuser,1,1,1,1,managerid,managername,version,now,$("input[name='avenantsignature1']").val(),$("input[name='avenantsignature2']").val()); };
                        options.buttons["Valider les modifications"]["style"] = "modal-button-2";
                        
                        $("#app-dialog").addClass('full-screen-dialog2');
                        $("#app-dialog .modalContent").css('height','85vh');
                        MM.widgets.dialog(html, options);
                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                        //Scroll To bottom
                        if (pifArray != "") {
                            window.setTimeout(function() {
                                    var elem = document.getElementById('pifContent');
                                    elem.scrollTop = elem.scrollHeight;
                            }, 500);
                        }
                        
                    },
                    function(path) {
                        MM.log('Image Signature Stagiaire Avenant NOK Version :'+version+' : '+fileAvenant2);
                        html += '<td class="center2" id="avenantsignature2"><input type="hidden" name="avenantsignature2" value="0"><button version="'+version+'" course="'+courseId+'" id="signature_stagiaire" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signatureAvenantPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                        html += '</table></div>';
                        
                        options.buttons["Valider les modifications"] = function() { validerAvenant(userspif,pifs,course,thisuser,1,1,1,1,managerid,managername,version,now,$("input[name='avenantsignature1']").val(),$("input[name='avenantsignature2']").val()); };
                        options.buttons["Valider les modifications"]["style"] = "modal-button-2";
                        
                        $("#app-dialog").addClass('full-screen-dialog2');
                        $("#app-dialog .modalContent").css('height','85vh');
                        MM.widgets.dialog(html, options);
                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                        //Scroll To bottom
                        if (pifArray != "") {
                            window.setTimeout(function() {
                                    var elem = document.getElementById('pifContent');
                                    elem.scrollTop = elem.scrollHeight;
                            }, 500);
                        }
                        
                    }
                );
            },
            function(path) {
                MM.log('Image Signature Manager Avenant NOK Version :'+version+' : '+fileAvenant1);
                html += '<tr><td class="center2" id="avenantsignature1"><input type="hidden" name="avenantsignature1" value="0"><button version="'+version+'" course="'+courseId+'" id="signature_manager" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signatureAvenantPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td>';
                //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
        
                MM.fs.findFileAndReadContents(fileAvenant2,
                    function(path) {
                        avenantsignature2 = path;
                        MM.log('Image Signature Stagiaire Avenant OK Version :'+version+' : '+fileAvenant2);
                        html += '<td class="center2" id="avenantsignature2"><input type="hidden" name="avenantsignature2" value="'+fileAvenant2+'"><img src="'+ path +'" width="300"></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                        html += '</table></div>';
                        
                        options.buttons["Valider les modifications"] = function() { validerAvenant(userspif,pifs,course,thisuser,1,1,1,1,managerid,managername,version,now,$("input[name='avenantsignature1']").val(),$("input[name='avenantsignature2']").val()); };
                        options.buttons["Valider les modifications"]["style"] = "modal-button-2";
                        
                        $("#app-dialog").addClass('full-screen-dialog2');
                        $("#app-dialog .modalContent").css('height','85vh');
                        MM.widgets.dialog(html, options);
                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                        //Scroll to bottom
                        if (pifArray != "") {
                            window.setTimeout(function() {
                                    var elem = document.getElementById('pifContent');
                                    elem.scrollTop = elem.scrollHeight;
                            }, 500);
                        }
                        
                    },
                    function(path) {
                        MM.log('Image Signature Stagiaire Avenant NOK Version :'+version+' : '+fileAvenant2);
                        html += '<td class="center2" id="avenantsignature2"><input type="hidden" name="avenantsignature2" value="0"><button version="'+version+'" course="'+courseId+'" id="signature_stagiaire" name="signature" userid="'+user+'" version="'+version+'" managerid="'+managerid+'" managername="'+managername+'" onclick="signatureAvenantPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></td></tr>';
                        //<td class="center2"><button course="'+courseId+'" id="signature_stagiaire_avant" name="signature" userid="'+user+'" onclick="signaturePifPopin(this)" class="btn grd-grisfonce text-blanc">Signature</button></tr>';
                
                        html += '</table></div>';
                        
                        options.buttons["Valider les modifications"] = function() { validerAvenant(userspif,pifs,course,thisuser,1,1,1,1,managerid,managername,version,now,$("input[name='avenantsignature1']").val(),$("input[name='avenantsignature2']").val()); };
                        options.buttons["Valider les modifications"]["style"] = "modal-button-2";
                        
                        $("#app-dialog").addClass('full-screen-dialog2');
                        $("#app-dialog .modalContent").css('height','85vh');
                        MM.widgets.dialog(html, options);
                       document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                        //Scroll to bottom
                        if (pifArray != "") {
                            window.setTimeout(function() {
                                    var elem = document.getElementById('pifContent');
                                    elem.scrollTop = elem.scrollHeight;
                            }, 1000);
                        }
                        
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
        //pifs2 = pifs;
        
        var pifs2 = $.grep(pifs, function( el ) {
                    return ((el.courseid != course) || (el.courseid == course && el.version != version));
        });
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
        //$('button#modifierpif[user="'+userpif.userid+'"]').attr('pif',JSON.stringify(pifs3));                    
        //MM.log('pifs length:'+pifs2.length)
        //MM.log('pif:'+pifs2[0]+'/'+pifs2[0].scormid);
        
        
        var options3 = {
            title: '',
            buttons: {}
        };
        
        options3.buttons["Fermer"] = function() {
            MM.widgets.dialogClose2();
            MM.log("Dialog:"+userpif.userid);
            window.setTimeout(function() {
                    var elem = document.getElementById('pifContent');
                    elem.scrollTop = elem.scrollHeight;
            }, 100);
        };
        options3.buttons["Fermer"]["style"] = "modal-button-5";
        
        
                        
        if (valider == 1 && (avenantsignature1 == 0 || avenantsignature2 == 0)) {
            //$("#app-dialog").removeClass('full-screen-dialog2');
            //$("#app-dialog .modalContent").css('height','100%');
            
            MM.popMessage2("Veuillez signer au bas du tableau, pour valider les compétences à développer dans le cadre du parcours de formation.",options3);
            valider = 0;
        }
        
        if (valider == 1){
                    $('button#pif[user="'+userpif.userid+'"]').attr('pif','');
                    //$('button#pif[user="'+userpif.userid+'"]').attr('pif',JSON.stringify(pifs3));
                    MM.log('Save:'+pifs2+','+pifs2.length);
                    thisuser.save({pif:pifs2});
                    version = parseInt(version) + 1;
                    $('button#pif[user="'+userpif.userid+'"]').attr('version',version);

        }
        
        
    }
    //MM.Router.navigate("eleves/" + course );
    if (valider == 1) {
        MM.log("Save PIF");
        var options2= {
            title: '',
            buttons: {}
        };
        options2.buttons["Fermer"] = function() {
            MM.widgets.dialogClose2();
            MM.widgets.dialogClose();
            //MM.log("Dialog:"+userpif.userid);
            $('button#pif[user="'+userpif.userid+'"]').click();
        };
         options2.buttons["Fermer"]["style"] = "modal-button-5";
        //$("#app-dialog").removeClass('full-screen-dialog2');
        //$("#app-dialog .modalContent").css('height','100%');
        MM.popMessage2("<h1>Vos modifications ont été enregistrées</h1>Pour qu'elles soient prises en compte, n'oubliez pas de fermer et valider la présente session de formation.<br/><br/>Si vous êtes hors-ligne, synchronisez vos données lors de votre prochaine connexion à un réseau.",options2);
            
        //MM.widgets.dialogClose();
        //$('button#pif[user="'+userpif.userid+'"]').click();
    }
    
}

function closeDialog(course,user) {
    MM.Router.navigate("eleves/" + course );
    $("#app-dialog").removeClass('full-screen-dialog2');
    $("#app-dialog .modalContent").css('height','100%');
    MM.widgets.dialogClose();
}


function downloadAvenantsManager(download,upload,av,max,courseId,userId) {
    
    MM.log('downloadAvenantsManager:'+download+','+upload+','+av+','+max);
    MM.fs.fileExists(upload,
        function(path) {
            av = av + 1;
            if (av <= max) {
                var downloadA = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+userId+'_'+av+'_signature_manager.png');
                var uploadA = MM.config.current_site.id+"/"+courseId+"/"+userId+"_"+av+"_signature_manager.png";
                downloadAvenantsManager(downloadA,uploadA,av,max,courseId,userId)
            } 
        },
        function(path) {
            MM.fs.createFile(upload,
                function(fullpath1) {
                    MM.log("Création de "+upload+" OK");
                    MM.moodleDownloadFile(download,upload,
                        function(fullpath2) {
                            MM.log("Upload de "+download+" vers "+upload+" OK");
                            av = av + 1;
                            if (av <= max) {
                                var downloadA = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+userId+'_'+av+'_signature_manager.png');
                                var uploadA = MM.config.current_site.id+"/"+courseId+"/"+userId+"_"+av+"_signature_manager.png";
                                downloadAvenantsManager(downloadA,uploadA,av,max,courseId,userId)
                            }
                        },
                        function(fullpath2) {
                            MM.log("Upload de "+download+" vers "+upload+" NOK");
                        },
                        false,
                        function (percent) {
                           MM.log(percent);
                        }
                    );
                },
                function(fullpath1) {
                    MM.log("Création de "+upload+" NOK");
                }
            );
        }
    );
        
    
}


function downloadAvenantsStagiaire(download,upload,av,max,courseId,userId) {
    MM.log('downloadAvenantsStagiaire:'+download+','+upload+','+av+','+max);
    MM.fs.fileExists(upload,
        function(path) {
            av = av + 1;
            if (av <= max) {
                var downloadA = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+userId+'_'+av+'_signature_stagiaire.png');;
                var uploadA = MM.config.current_site.id+"/"+courseId+"/"+userId+"_"+av+"_signature_stagiaire.png";;
                downloadAvenantsStagiaire(downloadA,uploadA,av,max,courseId,userId)
            }  
        },
        function(path) {
           MM.fs.createFile(upload,
                function(fullpath1) {
                    MM.log("Création de "+upload+" OK");
                    MM.moodleDownloadFile(download,upload,
                        function(fullpath2) {
                            MM.log("Upload de "+download+" vers "+upload+" OK");
                            av = av + 1;
                            if (av <= max) {
                                var downloadA = encodeURI(MM.config.current_site.siteurl + '/local/session/downloadpif.php?file='+courseId+'_'+userId+'_'+av+'_signature_stagiaire.png');;
                                var uploadA = MM.config.current_site.id+"/"+courseId+"/"+userId+"_"+av+"_signature_stagiaire.png";;
                                downloadAvenantsStagiaire(downloadA,uploadA,av,max,courseId,userId)
                            }
                        },
                        function(fullpath2) {
                            MM.log("Upload de "+download+" vers "+upload+" NOK");
                        },
                        false,
                        function (percent) {
                           MM.log(percent);
                        }
                    );
                },
                function(fullpath1) {
                    MM.log("Création de "+upload+" NOK");
                }
            ); 
        }
    );
        
    
    
}


function upTime(countTo,trigger) {
  now = new Date();
  difference = (now.getTime()-countTo);
  
  diffalerte = (now.getTime()-trigger);

  
  
  
  //days=Math.floor(difference/(60*60*1000*24)*1);
  hours=Math.floor(difference/(60*60*1000)*1);
  //hours=Math.floor((difference%(60*60*1000*24))/(60*60*1000)*1);
  mins=Math.floor(((difference%(60*60*1000*24))%(60*60*1000))/(60*1000)*1);
  secs=Math.floor((((difference%(60*60*1000*24))%(60*60*1000))%(60*1000))/1000*1);

  //if (document.getElementById('days'))
    //document.getElementById('days').firstChild.nodeValue = days;
  if (document.getElementById('hours'))
    document.getElementById('hours').firstChild.nodeValue = hours;
  if (document.getElementById('minutes'))
    document.getElementById('minutes').firstChild.nodeValue = mins;
  if (document.getElementById('seconds'))
    document.getElementById('seconds').firstChild.nodeValue = secs;
  
  if (diffalerte >= (60 * 30 * 1000)) {
    trigger = now.getTime();
    var since = hours + ' h ' + mins + ' min ' + secs + ' s';
    alertIdle(since);
  }
  
  clearTimeout(upTime.to);
  upTime.to=setTimeout(function(){ upTime(countTo,trigger); },1000);
}


function alertIdle(since) {
        var options= {
            title: '',
            buttons: {}
        };
        options.buttons["Fermer"] = function() {
            MM.widgets.dialogClose2();
        };
        
        var html = "Votre session de formation a été démarrée depuis <br/><strong>"+since+".</strong><br/>N'oubliez pas de fermer votre session, une fois votre formation terminée.";
       
        MM.widgets.dialog2(html, options);
}


function clickPif(thisbutton,courseid,userid,versionid,spifs) {
    
                        MM.log('Pif clicked');
                        var button = thisbutton;
                        var course = courseid;
                        var user = userid;
                        var version = versionid;
                        var theuser = MM.db.get("users", MM.config.current_site.id + "-" + parseInt(user));
                        MM.log('pif:'+course+'/'+user);
                        
                        var userspif = MM.db.where('users', {'userid':parseInt(user),'site':MM.config.current_site.id});
                        var userpif = userspif[0].toJSON();
                        var pifs = userpif.pif;
                        var grille = userpif.grille;
                        pifscourse = $.grep(pifs, function( el ) {
                                        return el.courseid == course;
                        });
                        
                        MM.log('pifscourse length:'+pifscourse.length);
                        
                        
                        var pifArrayOrg = spifs;
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
                        if (version == 1)
                            html += '<p align="center"><button onclick="modifierPif(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"  version="'+version+'" class="modal-button-6" style="width: 25%">Modifier le PIF</button></p>';
                        if (version == 2)
                            html += '<p align="center"><button onclick="voirpif(\''+course+'\',\''+user+'\',\''+version+'\')" course="'+course+'" user="'+user+'" version="'+version+'" class="modal-button-5" style="width: 25%">Voir le PIF</button><button onclick="modifierPif(this,\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"   version="'+version+'" class="modal-button-6" style="width: 25%">Modifier le PIF</button></p>';
                        if (version > 2)
                            html += '<p align="center"><button onclick="voirlespif(\''+course+'\',\''+user+'\')" course="'+course+'" user="'+user+'" version="'+version+'" class="modal-button-5" style="width: 25%">Voir le PIF</button><button onclick="modifierPif(this,\''+user+'\',\''+course+'\',\''+version+'\')" id="modifierpif" course="'+course+'" user="'+user+'"   version="'+version+'" class="modal-button-6" style="width: 25%">Modifier le PIF</button></p>';
                        
                        
                        if (grille != "" && grille != "[]") {
                            html += '<br/><br/><br/><p align="center">Une fois l\'ensemble du parcours de formation finalisée, vous pourrez compléter la grille<br/> de positionnement ci-dessous en aval de la formation.</p>';
                            html += '<table cellpadding="0" cellspacing="0" width="100%" border="0" class="tablo">';
                            
                            if (grille.q1 == 2 && grille.q2 == 2 && grille.q3 == 2) {
                                html += '<tr><td><span class="pifgris">GRILLE DE POSITIONNEMENT</span> <span class="pifnoir">AMONT :</span></td><td> <button style="width:200px" onclick="amont(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" class="modal-button-1">Voir</button></td></tr>';
                            } else {
                                html += '<tr><td><span class="pifgris">GRILLE DE POSITIONNEMENT</span> <span class="pifnoir">AMONT :</span></td><td> <button style="width:200px" onclick="amont(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" class="modal-button-5">Compléter</button></td></tr>';
                            }
                            
                            if (grille.q4 == 2 && grille.q5 == 2 && grille.q6 == 2) {
                                html += '<tr><td><span class="pifgris">GRILLE DE POSITIONNEMENT</span> <span class="pifnoir">AVAL :</span></td><td> <button style="width:200px" onclick="aval(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" class="modal-button-1">Voir</button></td></tr>';
                            } else {
                                if (grille.q1 == 2 || grille.q2 == 2 || grille.q3 == 2) {
                                    html += '<tr><td><span class="pifgris">GRILLE DE POSITIONNEMENT</span> <span class="pifnoir">AVAL :</span></td><td> <button style="width:200px" onclick="aval(\''+button+'\',\''+user+'\',\''+course+'\',\''+version+'\')" class="modal-button-5">Compléter</button></td></tr>';
                                } else {
                                    html += '<tr><td><span class="pifgris">GRILLE DE POSITIONNEMENT</span> <span class="pifnoir">AVAL :</span></td><td> <i>Aucune grille de positionnement amont validée</i></td></tr>';
                                }
                                
                            }
                            
                            html += '</table>';
                        }
                        
                        html+='</div>';
                        
                        var options = {
                            title: 'Stagiaire '+userpif.fullname+'<div class="closedialog"><a href="javascript:void(0)" onclick="closeDialog('+course+','+user+')">X</a></div>',
                            width: "98%",
                            marginTop: "5%",
                            buttons: {}
                        };
                        
                        options.buttons["Fermer"] = function() {
                            //MM.Router.navigate("eleves/" + course );
                            closeDialog(course,user);
                        };
                        
                        $("#app-dialog").addClass('full-screen-dialog2');
                        $("#app-dialog .modalContent").css('height','85vh');
                        MM.widgets.dialog(html, options);
                        document.getElementById("pifContent").style.height = ((window.innerHeight * 80)/100) + "px";

                        if (pifArray != "") {
                            $("button#modifierpif").click();
                            
                        }
                        
                        
                   
}



function uploadAvenant(userspif,on,course) {
     
    MM.log('UPLOADAVENANT');
    var indexuser = 0;
    var countuser = userspif.length;
    var uploaduser = 0;
    $.each(userspif, function( indexUsers, userpif ) {
                            
        jsonpif = userpif.toJSON();
        var fileAvenantSignatures = MM.config.current_site.id+"/"+course+"/"+jsonpif.userid+"_avenantsignatures.json"
        MM.log('Synchro fileAvenantSignatures : ' + fileAvenantSignatures);
        
        MM.fs.findFileAndReadContents(fileAvenantSignatures,
            function (result) {
                avenantSignatureArray = JSON.parse(result);
                var countAvenantSig = avenantSignatureArray.length;
                var indexAvenantSig = 0;
                var uploadAvenantSig = 0;
                
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
                                        function(r){
                                            MM.log('Upload Avenant réussi:'+path);
                                          
                                          
                                            if (r.responseCode != 200 || r.byteSent==0) {
                                                uploadAvenantSig = 1;
                                            }
                                            indexAvenantSig++;
                                            if (indexAvenantSig == countAvenantSig) {
                                                indexuser++;
                                                if (!uploadAvenantSig) {
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
                                            
                                            if (indexuser == countuser) {
                                                if (!uploadAvenantSig) {
                                                    //MM.log('SYNCHROSUITE');
                                                    synchroSuite2(on,course,course);
                                                } else {
                                                    MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 5000, resizable: false});
                                                }
                                            }
                                                                
                                        },
                                        function(error){
                                            MM.log('Pas Upload Avenant réussi:'+path);
                                            indexAvenantSig++;
                                            uploadAvenantSig = 1;
                                            uploaduser = 1;
                                           
                                            if (indexAvenantSig == countAvenantSig) {
                                                indexuser++;
                                            }
                                            
                                            if (indexuser == countuser) {
                                                if (!uploaduser) {
                                                    //MM.log('SYNCHROSUITE');
                                                    synchroSuite2(on,course,course);
                                                } else {
                                                    MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 5000, resizable: false});
                                                }
                                            }
                                                                
                                        },
                                        options2
                              );
                        },
                        function (path) {
                            MM.log('Pas de fileAveant : ' + valueAvenant);
                            indexAvenantSig++;
                            
                            if (indexAvenantSig == countAvenantSig) {
                                indexuser++;
                                if (!uploadAvenantSig) {
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
                            
                            if (indexuser == countuser) {
                                if (!uploadAvenantSig) {
                                    //MM.log('SYNCHROSUITE');
                                    synchroSuite2(on,course,course);
                                } else {
                                    MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 5000, resizable: false});
                                }
                            }
                                                
                        }
                    );
                });
                
            },
            function(result) {
                indexuser++;
                MM.log('Pas de fileAvenantSignatures :'+fileAvenantSignatures);
                MM.log('User :'+indexuser+'/'+countuser);
                
                if (indexuser == countuser) {
                    if (!uploaduser) {
                        //MM.log('SYNCHROSUITE');
                        synchroSuite2(on,course,course);
                    } else {
                        MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 5000, resizable: false});
                    }
                }
            }
        );
    });
}


function synchroSuite(on,course,courseId) {
     MM.log('SYNCHROSUITE');
     if (on == undefined || on == "off") {                       
                                
        $("#synchroR").attr('on','on');
        MM.log('Synchro On:'+on+','+$("#synchroR").attr('on'));
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
                                    var countSig = users.length;
                                    var indexSig = 0;
                                    var uploadSig = 0;
            
                                    MM.log("Users:"+obj.users+"/"+users+"/"+obj.modulesId+"/"+modulesId+"/"+countSig);
                                    
                                    $.each(users, function( indexU, valueU ) {
                                        
            
                                        var signatureFile = directoryResult + valueU + '_' + obj.starttime + '.png';
                                        var signatureRelFile =  MM.config.current_site.id + "/" + course + "/result/" + valueU + '_' + obj.starttime + '.png';
                                        MM.log('Participants:'+valueU+','+signatureFile);
                                        MM.fs.fileExists(signatureFile,
                                                function(path) {
                                                    MM.log('Signature '+path+' Existe');
                                                    var options = {};
                                                    options.fileKey="file";
                                                    options.fileName = users[indexU]+'.png';
                                                    options.mimeType="image/png";
                                                    options.params = {
                                                        itemid:users[indexU]
                                                    };
                                                    options.chunkedMode = false;
                                                    options.headers = {
                                                      Connection: "close"
                                                    };
                                                    
                                                    var ft = new FileTransfer();
                                                    ft.upload(
                                                              path,
                                                              MM.config.current_site.siteurl + '/local/session/uploadsignatureoffline.php',
                                                              function(r){
                                                                MM.log('Upload réussi');
                                                                if (r.responseCode != 200 || r.byteSent==0) {
                                                                    uploadSig = 1;
                                                                }
                                                                indexSig = indexSig + 1;
                                                                if (!uploadSig) {
                                                                        MM.fs.removeFile (signatureRelFile,
                                                                            function (result) {
                                                                               MM.log('Le fichier '+signatureRelFile+' a bien été effacé');
                                                                            },
                                                                            function (result) {
                                                                               MM.log('Le fichier '+signatureRelFile+' n a pas pu étre effacé');
                                                                            }
                                                                       );
                                                                }
                                                                if (indexSig == countSig) {
                                                                    if (!uploadSig) {
                                                                        //MM.log('SYNCHROSUITE2');
                                                                        synchroSuite2(on,course,course);
                                                                    } else {
                                                                        MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 5000, resizable: false});
                                                                    }
                                                                }
                                                              },
                                                              function(error){
                                                                 indexSig++;
                                                                 uploadSig = 1;
                                                                 MM.log('Upload pas réussi');
                                                                 if (indexSig == countSig) {
                                                                    if (!uploadSig) {
                                                                        //MM.log('SYNCHROSUITE2');
                                                                        synchroSuite2(on,course,course);
                                                                    } else {
                                                                        MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 5000, resizable: false});
                                                                    }
                                                                }
                                                                
                                                              },
                                                              options
                                                    );

                                                    
                                                },
                                                function(path) {
                                                    MM.log('Signature Existe pas');
                                                    indexSig = indexSig + 1;
                                                    if (indexSig == countSig) {
                                                        if (!uploadSig) {
                                                            //MM.log('SYNCHROSUITE2');
                                                            synchroSuite2(on,course,course);
                                                        } else {
                                                            MM.popMessage("Un problème est survenu lors du transfert des signatures.<br/>Veuillez recommencer la synchro.", {title:'Synchronisation des résultats', autoclose: 500, resizable: false});
                                                        }
                                                    }
                                                }
                                        );
                                        
                                        
                                        
                                    });
                                                
                                    
                                },
                                function(result) {
                                    MM.log( "Session File NOK :" + sessionFile);
                                    $("#synchroR").attr('on','off');
                                }
                            );
                                
                        }
                    });
                  }
                
            }                                       ,
            function() {
                //
            }
        );
    
    } else {
        MM.log( "Session En cours" + sessionFile);
    }
}




function synchroSuite2(on,courseId,course) {
     MM.log('SYNCHROSUITE2');
     if (on == undefined || on == "off") {                       
        
        
        //Get Pifs
        var pifscourse = new Array();
        var grillecourse = new Array();
        var pifsusers = "";
        var message = "";
        var userspif = MM.db.where("users",{site: MM.config.current_site.id});
       
        $.each(userspif, function( indexUsers, userpif ) {
            var jsonpif = userpif.toJSON();
            var pifs = jsonpif.pif;
            var grille = jsonpif.grille;
            grillecourse[indexUsers] = grille;
            
            //MM.log('UsersPif:'+jsonpif.id+'/'+course+'/'+MM.config.current_site.id);
            pifsusers += jsonpif.userid+',';
            if (!pifs) {
                pifs = '[]';
            }
            pifscourse[indexUsers] = $.grep(pifs, function( el ) {
                            return el.courseid == course;
            });
            //MM.log('pifscourse:'+pifscourse.length);
        });
                        
        $("#synchro").attr('on','on');
        MM.log('Synchro On:'+on+','+$("#synchro").attr('on'));
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
                                    var countSig = obj.users.length;
                                    var indexSig = 0;
                                    var uploadSig = 0;
                                    
                                    var pifscoursejson = JSON.stringify(pifscourse);
                                    MM.log('check');
                                    if (obj.notes) {
                                        var jsonnotes = JSON.stringify(obj.notes);
                                    } else {
                                        jsonnotes = "[]";
                                    }
                                    
                                    var jsongrille = JSON.stringify(grillecourse);
                                   
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
                                        "notes" : jsonnotes,
                                        "grille": jsongrille
                                    }
                    
                                    //MM.widgets.dialogClose();
                                                   
                                    MM.moodleWSCall('local_mobile_update_report_completion_by_userid_courseid', data,
                                        function(status){
                                            var sessionTime = new Date(parseInt(obj.starttime));
                                            
                                            //var sessionDate = sessionTime.getDate()+"/"+(sessionTime.getMonth()+1)+"/"+sessionTime.getFullYear()+" "+sessionTime.getHours()+":"+sessionTime.getMinutes();
                                            var sessionDate = ("0" + sessionTime.getDate()).slice(-2)+"/"+("0" + (sessionTime.getMonth() + 1)).slice(-2)+"/"+sessionTime.getFullYear() + ' à ' + ("0" + sessionTime.getHours()).slice(-2)+":"+("0" + sessionTime.getMinutes()).slice(-2);

                                            var participants_users = status.participants_user.split(",");
                                            var participants_id = status.participants_id.split(",");
                                            var countuser = participants_users.length;
                                            var indexuser = 0;
                                            var uploaduser = 0;
                                            
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
                                                                      function(r){
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
                                                                        MM.fs.removeFile (signatureRelFile,
                                                                                function (result) {
                                                                                   MM.log('Le fichier '+signatureRelFile+' a bien été effacé');
                                                                                },
                                                                                function (result) {
                                                                                   MM.log('Le fichier '+signatureRelFile+' n a pas pu étre effacé');
                                                                                }
                                                                        ); 
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
                                                   $("#synchroR").attr('on','off');
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
                                                   $("#synchroR").attr('on','off');
                                                   
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
                                            $("#synchroR").attr('on','off');
                                            $("#synchroR").show();
                                            
                                        }
                                    );
                                    
                                },
                                function(result) {
                                    MM.log( "Session File NOK :" + sessionFile);
                                    $("#synchroR").attr('on','off');
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
}


function updateGrille() {
        MM.log('UPDATEGRILLE');
        var userspif = MM.db.where("users",{site: MM.config.current_site.id});
        var grillecourse = new Array();
        
        $.each(userspif, function( indexUsers, userpif ) {
            var jsonpif = userpif.toJSON();
            var grille = jsonpif.grille;
            grillecourse[indexUsers] = grille;
            
        });
                        
        var jsongrille = JSON.stringify(grillecourse);
       
        var data = {
            "grille": jsongrille
        }
                    
                                    //MM.widgets.dialogClose();
                                                   
        MM.moodleWSCall('local_mobile_update_grille', data,
            function(status){
                MM.log('update grille OK');
                
                
                
            },
            {
                getFromCache: false,
                saveToCache: false,
                silently: true
            },
            function(e) {
                MM.log("update grille NOK " + e);
            }
        );
                                    
                                
}
