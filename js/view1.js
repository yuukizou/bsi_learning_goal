var skillMap_out = {};
// courses has that skill as pre / out
function getSkillmap(courses) {
    for (track in courses) {
        for (course in courses[track]) {
            for (skill in courses[track][course]["Outcomes"]) {
                var level = courses[track][course]["Outcomes"][skill];
                var ID = courses[track][course]["courseID"].replace(/\s/g, '')

                var _course = { courseName: course, courseID: ID, track: track };
                // console.log(_course)

                if (skillMap_out[skill] == undefined) {
                    skillMap_out[skill] = {};
                    skillMap_out[skill][level] = [];
                    skillMap_out[skill][level].push(_course);
                    // console.log("???", skillMap_out[skill]);
                    // console.log("kkk", skillMap_out);
                } else {
                    if (skillMap_out[skill][level] == undefined) {
                        skillMap_out[skill][level] = [];
                        skillMap_out[skill][level].push(_course);
                    } else {
                        skillMap_out[skill][level].push(_course);
                    }
                }
            }
        }
    }
}


function dataProcessing(courses) {
    var mdata = [];
    // console.log("map", skillMap_out);
    for (track in courses) {
        for (course in courses[track]) {
            var id = courses[track][course]["courseID"].replace(/\s/g, '');
            var _course = { track: track, courseName: course, courseID: id, fullfilled: 0, total: 0 };
            var cnt = 0;
            // console.log("course", course);
            for (skill in courses[track][course]["Pre-reqs"]) {
                // console.log("skill", skill);
                var level = courses[track][course]["Pre-reqs"][skill];
                if (skillMap_out[skill] && skillMap_out[skill][level] && skillMap_out[skill][level].length > 0) {
                    _course.fullfilled += 1;
                    _course.total += 1;
                } else {
                    _course.total += 1;
                }
                cnt++;
            }

            // console.log("course", _course);
            if (cnt != _course.total) console.log("sth wrong");
            mdata.push(_course);
        }
    }
    return mdata;
}

function filterSelection(c) {
    if (c == 'all') {
        $('.filterDiv').addClass('show');
    } else {
        var x, i;
        x = $('.filterDiv').removeClass('show');
        for (i = 0; i < x.length; i++) {
            // console.log("x", x[i].childNodes[0].className);
            if (x[i].childNodes[0].className.indexOf(c) > -1)
                //console.log(x[i]);//x[i].addClass("show"); 
                addClass(x[i], "show");
        }
    }
}

function addClass(element, name) {
    var i, arr1, arr2;
    arr1 = element.className.split(" ");
    arr2 = name.split(" ");
    for (i = 0; i < arr2.length; i++) {
        if (arr1.indexOf(arr2[i]) == -1) {
            element.className += " " + arr2[i];
        }
    }
}

function removeClass(element, name) {
    var i, arr1, arr2;
    arr1 = element.className.split(" ");
    arr2 = name.split(" ");
    for (i = 0; i < arr2.length; i++) {
        while (arr1.indexOf(arr2[i]) > -1) {
            arr1.splice(arr1.indexOf(arr2[i]), 1);
        }
    }
    element.className = arr1.join(" ");
}

function animateProgressBar(el, width) {
    el.animate({ width: width }, {
        duration: 2000,
        step: function(now, fx) {
            if (fx.prop == 'width') {
                // el.html(Math.round(now * 100) / 100 + '%');
            }
        }
    });
}

function transfer(ele) {
    if (!ele.childNodes) return;
    var a = ele.childNodes[0].getAttribute('data-id');
    var b = ele.childNodes[0].getAttribute('data-name');
    // console.log(ele.children[0]);
    var url = 'treediagram.html?courseID=' + a + '&courseName=' + b;
    console.log(url);
    document.location.href = url;
}

$(document).ready(function() {
    console.log("history",document.referrer);
    var tem = document.referrer;
    if((tem != undefined || tem != "")&& tem.indexOf("treediagram.html") == -1 && tem.indexOf("part3.html") == -1){
        $('.tutor a').fancybox().trigger('click');
    }
    $.getJSON("js/data.json", function(data) {
        // console.log(data);
        getSkillmap(data);
        var mdata = dataProcessing(data);
        // console.log(mdata);

        mdata.sort(function(a, b) {
            var prea, preb;
            if (a['total'] != 0) prea = a["fullfilled"] / a["total"];
            else prea = 1;
            if (b['total'] != 0) preb = b["fullfilled"] / b["total"];
            else preb = 1;
            return prea - preb;
        })
        $.each(mdata, function(infoIndex, info) {
            var per;
            if (info["fullfilled"] + info["total"] == 0) per = 100;
            else per = (info["fullfilled"] / info["total"]) * 100;
            var per_str = info["fullfilled"] + "/" + info["total"];

            var item;
            if(info["total"] == 0)
                item = "<div class='progress filterDiv tooltip' data-width='" + per + "%'><div class='" 
                        + info["track"] + "' data-name='" + info["courseName"] + "' data-id='" + info["courseID"] + "'>" 
                        + per_str + "</div><span class='name'>" + info["courseID"] + " - " + info["courseName"] 
                        + "</span><span class='tooltiptext'>This course has no prerequisite skills</span></div>";
            else
                item = "<div class='progress filterDiv' onclick='transfer(this)' data-width='" + per + "%'><div class='" + info["track"] + "' data-name='" + info["courseName"] + "' data-id='" + info["courseID"] + "'>" + per_str + "</div><span class='name'>" + info["courseID"] + " - " + info["courseName"] + "</span></div>";
            
            $('#courses').append(item);
            // $('.filterDiv').click(transfer(this));

        })

        filterSelection("all");

        var btns = $(".btn");
        for (var i = 0; i < btns.length; i++) {
            btns[i].addEventListener("click", function() {
                var current = $(".active");
                current[0].className = current[0].className.replace(" active", "");
                this.className += " active";
            });
        }
        $('.progress').each(function() {
            animateProgressBar($(this).find("div"), $(this).data("width"));
        });
    })
})

