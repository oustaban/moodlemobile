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
            
            
            if (MM.deviceConnected()) {
                var data = {
                    "userid" : MM.site.get('userid')
                };
                var settings = {omitExpires: true};
                MM.log("WEBSERVICE:local_mobile_get_courses_with_role");
                MM.moodleWSCall(
                    'local_mobile_get_courses_with_role',
                    data,
                    function(courses) {
                        // Store the courses
                        for (el in courses) {
                            // We clone the course object because we are going to modify it in a copy.
                            var storedCourse = JSON.parse(JSON.stringify(courses[el]));
                            storedCourse.courseid = storedCourse.id;
                            storedCourse.siteid = MM.config.current_site.id;
                            // For avoid collising between sites.
                            storedCourse.id = MM.config.current_site.id + '-' + storedCourse.courseid;
                            var r = MM.db.insert('courses', storedCourse);
                        }
                    },
                    {
                        getFromCache: false,
                        saveToCache: true
                    },
                    function () {
                        MM.log('Problem with local_mobile_get_courses_with_role');
                    }
                );
            }
            
            MM.plugins.eleves._loadEleves(courseId, 0, MM.plugins.report.limitNumber,
                function(users) {
                    
                    var localCourses = MM.db.where('contents', {'courseid':courseId, 'site':MM.config.current_site.id, 'webOnly':true, 'visible':1});
                    var modules = [];
                    $.each(localCourses, function( index, value ) {
                            var localCourse = value.toJSON();
                            modules.push(localCourse);
                            
                    });
                    
                    
                    
                    
                    
                    var localModules = MM.db.where('courses', {'id':MM.config.current_site.id+'-'+courseId});
                    var localModule = localModules[0].toJSON();
                    var modulesUserValidated = [];
                    var modulesUserPif = [];
                    var licensesUser = [];
                    
                    var physicalScreenWidth = effectiveDeviceWidth();
                    var physicalScreenHeight = effectiveDeviceHeight();
                    var sizetdmodule = (physicalScreenWidth - (506 + (modules.length*2))) / modules.length;
                    var sizesection = physicalScreenHeight - 100;
                    var sizesecond = sizesection - 310;
                    
                    
                    MM.log('SIZE:' + physicalScreenWidth+'/'+sizetdmodule+'/'+modules.length);
                    
                    
                    $.each(users, function( index, user ) {
                            
                            var userspif = MM.db.where('users', {userid:parseInt(user.id)});
                            /*
                            var userspif = $.grep(user.pif, function( el ) {
                                            return el.userid == user.id;
                            });
                            */
                            
                            modulesUserPif[user.id] = [];
                            modulesUserPif[user.id]['count'] = 0;
                            
                                
                            if (userspif[0]) {
                                var userpif = userspif[0].toJSON();
                                var pifs = userpif.pif;
                                pifscourse = $.grep(pifs, function( el ) {
                                                return el.courseid == courseId;
                                });
                                
                                if (pifscourse.length > 0) {
                                    modules.forEach(function(module) {
                                        var version = 0;
                                        $.each(pifscourse, function( indexpif, pifcourse ) {
                                            if (pifcourse.scormid == module.contentid) {
                                                if (pifcourse.begin==1) {
                                                    //code
                                                
                                                    if (modulesUserPif[user.id][module.contentid] && pifcourse.version>=version){
                                                        modulesUserPif[user.id][module.contentid] = 1;
                                                        version = pifcourse.version;
                                                    }
                                                    if (!modulesUserPif[user.id][module.contentid] && pifcourse.version>=version) {
                                                        modulesUserPif[user.id]['count']++;
                                                        modulesUserPif[user.id][module.contentid] = 1;
                                                        version = pifcourse.version;
                                                    }
                                                } else {
                                                    if (modulesUserPif[user.id][module.contentid] && pifcourse.version>=version){
                                                        modulesUserPif[user.id][module.contentid] = 0;
                                                        version = pifcourse.version;
                                                        modulesUserPif[user.id]['count']--;
                                                    }
                                                    if (!modulesUserPif[user.id][module.contentid] && pifcourse.version>=version) {
                                                        modulesUserPif[user.id][module.contentid] = 0;
                                                        version = pifcourse.version;
                                                    }
                                                }
                                                
                                                
                                                //MM.log('PIFCOURSE1:'+physicalScreenWidth+'/'+pifcourse.scormid+'/'+module.contentid+'/'+pifcourse.begin+'/'+pifcourse.version+'/'+user.id);
                                            
                                            }
                                        });
                                    });
                                } else {
                                    MM.log('NOT PIFCOURSE:'+user.id+'/'+courseId);
                                }
                            } else {
                                MM.log('NOT PIF:'+user.id);
                            }
                            
                            
                            
                    
                            //MM.log('LOCAL MODULES:'+user.id+'/'+localModule.minduration);
                            var modulesuser = $.grep(localModule.modules, function( el ) {
                                            return el.userid == user.id;
                            });
                            
                            
                            
                            var moduleuser = modulesuser[0];
                            modulesUserValidated[user.id] = [];
                            var count = 0;
                            modulesUserValidated[user.id]['count'] = 0;
                            
                            if (moduleuser) {
                                $.each(moduleuser.modules, function( index2, module1 ) {
                                    for(var propertyName in module1) {
                                        //MM.log('PROP:'+propertyName+'/'+module1[propertyName]);
                                    }
                                    //MM.log('CHECK:'+module1['duration']+'/'+module1.duration);
				    if (modulesUserPif[user.id][module1.id]>0) { 
                                    if (parseInt(module1['duration']) >= parseInt(localModule.minduration)) {
                                        MM.log('CHECK1:'+user.id+'/'+module1.id+'/'+parseInt(module1['duration'])+'/'+parseInt(localModule.minduration));
                                        modulesUserValidated[user.id][module1.id] = 1;
                                        count++;
                                        modulesUserValidated[user.id]['count'] = count;
                                    } else {
                                        MM.log('CHECK2:'+user.id+'/'+module1.id+'/'+parseInt(module1['duration'])+'/'+parseInt(localModule.minduration));
                                        modulesUserValidated[user.id][module1.id] = 2;
                                        //count++;
                                        //modulesUserValidated[user.id]['count'] = count;
                                    }
				    }
                                });
                            } else {
                                MM.log('NO MODULE')
                            }
                            
                            var licensedsuser = $.grep(localModule.licenses, function( el ) {
                                            return el.userid == user.id;
                            });
                            
                            licensesUser[user.id] = licensedsuser[0];
                            
                            
                    });
                    
                    
                    var tpl = {
                        users: users,
                        modules: modules,
                        modulesUserValidated: modulesUserValidated,
                        licensesUser: licensesUser,
                        deviceType: MM.deviceType,
                        courseId: courseId,
                        modulesUserPif:modulesUserPif,
                        sizetdmodule: sizetdmodule,
                        sizesection: sizesection,
                        sizesecond: sizesecond
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

function effectiveDeviceWidth() {
    //var deviceWidth = window.orientation == 0 ? window.screen.width : window.screen.height;
    var deviceWidth = Math.max(window.screen.width, window.innerWidth);
    // iOS returns available pixels, Android returns pixels / pixel ratio
    // http://www.quirksmode.org/blog/archives/2012/07/more_about_devi.html
    //MM.log(window.screen.width+'/'+window.innerWidth);
    if (navigator.userAgent.indexOf('Android') >= 0 && window.devicePixelRatio) {
        //MM.log('DEVICEWIDTH:'+deviceWidth+'/'+window.devicePixelRatio);
        deviceWidth = deviceWidth / window.devicePixelRatio;
    }
    MM.log('DEVICEWIDTH:'+deviceWidth);
    return deviceWidth;
}

function effectiveDeviceHeight() {
    //var deviceWidth = window.orientation == 0 ? window.screen.width : window.screen.height;
    var deviceHeight = Math.min(window.screen.height, window.innerHeight);
    // iOS returns available pixels, Android returns pixels / pixel ratio
    // http://www.quirksmode.org/blog/archives/2012/07/more_about_devi.html
    //MM.log(window.screen.width+'/'+window.innerWidth);
    if (navigator.userAgent.indexOf('Android') >= 0 && window.devicePixelRatio) {
        //MM.log('DEVICEWIDTH:'+deviceWidth+'/'+window.devicePixelRatio);
        //deviceHeight = deviceHeight / window.devicePixelRatio;
    }
    MM.log('DEVICEHEIGHT:'+deviceHeight+'/'+window.screen.width+'/'+window.innerWidth+'/'+window.screen.height+'/'+window.innerHeight);
    return deviceHeight;
}
