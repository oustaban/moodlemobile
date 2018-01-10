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
                            for(var key2 in localCourse) {
                                MM.log("Porperty:"+key2+" Value: "+localCourse[key2]);
                            }
                    });
                    
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
                                $("ul#listeparticipants1 li[eleve='eleveP"+user.id+"']").removeClass('hide');
                                //MM.log("Searchparticipants:"+user.id+'/'+user.fullname);
                            } else {
                                $("ul#listeparticipants1 li[eleve='eleveP"+user.id+"']").addClass('hide');
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
