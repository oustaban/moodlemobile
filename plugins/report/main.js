var templates = [
    "root/externallib/text!root/plugins/report/report.html",
    "root/externallib/text!root/plugins/report/eleves_row.html"
];

define(templates,function (reportTpl, elevesRowTpl) {
    var plugin = {
        settings: {
            name: "report",
            type: "course",
            menuURL: "#report/",
            lang: {
                component: "core"
            },
            icon: ""
        },

        

        routes: [
            ["report/:courseId", "report", "showReport"],
        ],
        
        limitNumber:10000,

        showReport: function(courseId) {
            MM.panels.showLoading('center');

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }
            // Adding loading icon.
            $('a[href="#report/' +courseId+ '"]').addClass('loading-row');
            
            MM.plugins.eleves._loadEleves(courseId, 0, MM.plugins.report.limitNumber,
                function(users) {
                    
                    var localCourses = MM.db.where('contents', {'courseid':courseId, 'site':MM.config.current_site.id, 'webOnly':true, 'visible':1});
                    
                    
                    var modules = [];
                    
                    $.each(localCourses, function( index, value ) {
                            var localCourse = value.toJSON();
                            modules.push(localCourse);
                            
                    });
                    
                    
                    var localModules = MM.db.where('courses', {'id':MM.config.current_site.id+'-'+courseId});
                    MM.log('LOCAL MODULES:'+courseId+'/'+MM.config.current_site.id+'/'+localModules.length+'/'+localModules);
                    var localModule = localModules[0].toJSON();
                    var modulesUserValidated = []
                    $.each(users, function( index, user ) {
                            MM.log('LOCAL MODULES:'+user.id+'/'+localModule.minduration);
                            var modulesuser = $.grep(localModule.modules, function( el ) {
                                            return el.userid == user.id;
                            });
                            for(var propertyName in modulesuser[0]) {
                                MM.log('PROP:'+propertyName+'/'+modulesuser[0][propertyName]);
                                // propertyName is what you want
                                // you can get the value like this: myObject[propertyName]
                             }
                            var moduleuser = modulesuser[0];
                            for(var propertyName in moduleuser.modules) {
                                MM.log('PROP:'+propertyName+'/'+moduleuser.modules[propertyName]);
                                // propertyName is what you want
                                // you can get the value like this: myObject[propertyName]
                             }
                            $.each(moduleuser.modules, function( index2, module1 ) {
                                var modulesUserValidated = $.grep(module1, function( el ) {
                                                return el.duration >= value.minduration;
                                });
                            });
                            
                            MM.log('modulesValidated:'+modulesUserValidated.length);
                    });
                    
                    /*
                    modulesValidated = modulesValidated.toJSON();
                    
                    for (var i = 0;i<modulesValidated.length;i++) {
                        MM.log('Modules Passés:'+modulesValidated[i].name);
                    }
                    */
                    var tpl = {
                        users: users,
                        modules: modules,
                        deviceType: MM.deviceType,
                        courseId: courseId,
                    };
                    var html = MM.tpl.render(MM.plugins.report.templates.report.html, tpl);
        
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
                     
                    $('#search').keyup(function(e) {
                        var sword = $( "#search" ).val().toLowerCase();
                        MM.log("Search:"+sword+'/Users:'+users);
                        var searchparticipants = [];
                        users.forEach(function(user) {
                            //MM.log("User:"+user.id+'/'+user.fullname);
                            if (user.fullname.toLowerCase().indexOf(sword) != -1) {
                                searchparticipants.push(user);
                                $("tr[eleve='eleveP"+user.id+"']").show();
                                //MM.log("Searchparticipants:"+user.id+'/'+user.fullname);
                            } else {
                                $("tr[eleve='eleveP"+user.id+"']").hide();
                            }
                        });
                    });
                    
                    $('a[href="#report/' +courseId+ '"]').removeClass('loading-row');
                    
                }, function(m) {
                    // Removing loading icon.
                    $('a[href="#report/' +courseId+ '"]').removeClass('loading-row');
                    if (typeof(m) !== "undefined" && m) {
                        MM.popErrorMessage(m);
                    }
                }
            );
        },
        
        
        templates: {
            "report": {
                html: reportTpl
            },
            "elevesRow": {
                html: elevesRowTpl
            }
        }
    }

    MM.registerPlugin(plugin);
});
