var skillMap_out = {};
// courses has that skill as pre / out
function getSkillmap(courses) {
  for (track in courses) {
    for (course in courses[track]) {
      for (skill in courses[track][course]["Outcomes"]) {
        var ID = courses[track][course]["courseID"].replace(/\s/g, '')
        var level = courses[track][course]["Outcomes"][skill];
        var _course = {
          courseName: course,
          courseID: ID,
          track: track
        };

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


function getPrereqs(data, id) {
  for (track in data) {
    for (course in data[track]) {
      if (data[track][course]["courseID"] == id) return data[track][course]["Pre-reqs"];
    }
  }
}

function checkFullfilled(skill, skillLevel) {
  // console.log("skill",skill);
  // console.log("skillfullfilled",skillMap_out[skill]);
  if (skillMap_out[skill] != undefined && skillMap_out[skill][skillLevel] != undefined && skillMap_out[skill][skillLevel].length > 0) return "connect";
  else return "disconnect";
}

var skillCategory = [];
var weight = 1;

function insertSkill(skill, cate, skillLevel) {
  var exist = false;
  for (var i = 0; i < skillCategory.length; i++) {
    if (skillCategory[i].key == cate) {
      var connect = checkFullfilled(skill, skillLevel); //
      // console.log("skill", skill);
      // console.log("skillLevel", skillLevel);
      // console.log("fullfilled", connect);

      var child = {
        "colorCode": connect,
        "name": [cate, skill],
        "key": [skill, ' ' + skillLevel + ' '],
        "size": weight
      };
      skillCategory[i].children.push(child);
      exist = true;
      break;
    }
  }
  if (exist == false) {
    var connect = checkFullfilled(skill, skillLevel); //
    var skillCate = {
      "colorCode": "connect",
      "children": [{
        "colorCode": connect,
        "name": [cate, skill],
        "key": [skill, ' ' + skillLevel + ' '],
        "size": weight
      }],
      "name": [cate],
      "key": cate,
      "size": 1
    };
    skillCategory.push(skillCate);
  }
}

var courseID;

window.onload = function() {
  var url = document.location.href,
    param = url.split('?')[1].split('&')[0],
    item = param.split('=')
  var res = item[1].substr(0, 2) + ' ' + item[1].substr(2, 3);
  courseID = res;
}

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};
CourseName = getUrlParameter('courseName');
CourseId = getUrlParameter('courseID');

d3.select("#subtitle")
.text("Prerequiste Skills Required by "+ CourseId +" : "+ CourseName)


$(document).ready(function() {
  // 1. parse url, get courseID
  // var courseID = "SI 206";

  // 2. get data
  $.getJSON("js/data.json", function(data) {
    // console.log(data);
    getSkillmap(data);
    var pres = getPrereqs(data, courseID);
    console.log(pres);
    var preNames = Object.keys(pres);
    // console.log(preNames);

    $.getJSON("js/skills.json", function(skillsData) {
      // console.log(skillsData);
      for (var i = 0; i < preNames.length; i++) {
        // console.log("preNames", preNames[i]);
        var subskill = preNames[i];
        var skillcate = skillsData[subskill];
        var skillLevel = pres[subskill];
        insertSkill(subskill, skillcate, skillLevel);
      }

      for (var i = 0; i < skillCategory.length; i++) {
        var children = skillCategory[i].children;
        for (var j = 0; j < children.length; j++) {
          if (children[j].colorCode == "disconnect") skillCategory[i].colorCode = "disconnect";
        }
        skillCategory[i].size = children.length * weight + weight;
      }
      // console.log("skillCategory", skillCategory);

      var margin = {
          top: 20,
          right: 120,
          bottom: 20,
          left: 120
        },
        width = 1800,
        height = 1000;

      var i = 0,
        duration = 750, // animation duration
        root; // stores the tree structure in json format

      var tree = d3.layout.tree()
        .size([height, width]).sort(function(a, b) {
          return d3.descending(a.colorCode, b.colorCode);
        });

      var edge_weight = d3.scale.linear()
        .domain([0, 100])
        .range([0, 100]);

      var diagonal = d3.svg.diagonal()
        .projection(function(d) {
          return [d.y, d.x];
        });

      // SVG for data annotation

      var svg1 = d3.select("div#viz").append("svg")
        .attr("width", "1000")
        .attr("height", "40")
      svg1.append("line")
        .attr("class", "line")
        .attr("x1", "300")
        .attr("x2", "350")
        .attr("y1", "25")
        .attr("y2", "25")
        .attr("stroke-width", "5px")
      svg1.append("text")
        .attr("x", "360")
        .attr("y", "30")
        .text("One or more skills are not taught by any other classes")
        .style("font-family", "Lato")
        .style("fill", "#f5eeee")

      //Creating SVG for Tree Diagram
      var svg = d3.select("div#viz").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var bsi = {
        "children": skillCategory,
        "name": "course",
        "size": 70,
        "key": courseID
      };
      edge_weight.domain([0, 4 * bsi.size]);
      root = bsi;
      root.x0 = height / 2;
      root.y0 = 0;
      root.children.forEach(collapse);
      // console.log(root.key)
      update(root);

      // d3.select(self.frameElement).style("height", "500px");

      /**
       * Updates the node.
       * cloppases and expands the node bases on the structure of the source
       * all 'children' nodes are expanded and '_children' nodes collapsed
       *
       */
      function update(source) {
        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
          d.y = d.depth * 300;
        });

        // Update the nodesâ€¦
        var node = svg.selectAll("g.node")
          .data(nodes, function(d) {
            return d.id || (d.id = ++i);
          });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
          })
          .on("click", click);

        // nodeEnter.append("circle")
        //     .attr("r", 1e-6)
        //     .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
        nodeEnter.append("path")
          .style("stroke", "grey")
          .attr("d", d3.svg.symbol()
            .type(function(d) {
              if (d.size >= 50) {
                return "square";
              } else {
                return "circle";
              }
            }));
        //add text to each node
        nodeEnter.append("text")
          .on("click", function(d) {
            skill = d.key[0];
            if (d.colorCode == "connect"){
              fulfilled = true
            }
            else{
              fulfilled = false
            }
            // console.log(fulfilled)
            level = d.key[1].split(' ')[1]
            course = root.key
            course1 = course.replace(/\s/g, '')
            url = 'part3.html?skill=' + skill + '&level=' + level + '&courseID=' + course1 + '&courseName='+ CourseName + '&fulfilled=' + fulfilled;
            // console.log(url)
            if (!d._children && d.size ==1) {
              document.location.href = url;
            }
          })
          .attr("x", function(d) {
            if (d.size >= 50) {
              if (d.children == null) {
                return -20;
              } else if (d.children != null) {
                return 15;
              }
            } else {
              return d.children || d._children ? -20 : 20;
            }
          })
          .attr("dy", ".35em")
          // .attr("y", "20")
          .attr("x", function(d) {
            if (d.size > 50) {
              return -100
            } else {
              return "15"
            }
          })
          .attr("y", function(d) {
            if (d.size > 50) {
              return 15
            }
          })
          .attr("class", "label")
          // .attr("transform", "rotate(1.5)")
          .attr("text-anchor", function(d) {
            return d.children || d._children ? "start" : "start";
          })
          .text(function(d) {
            return d.key;
          })
          .style("font-family", "Lato")
          .style("font-size", function(d) {
            if (d.size >= 50) {
              return "25pt"
            } else {
              return "10pt"
            }
          })
          .style("fill", "#f5eeee")
          .style("fill-opacity", 1e-6)
        nodeEnter.insert("rect", "text")
          .attr("width", "180")
          .attr("height", function(d) {
            if (d.size > 50) {
              return 100
            } else {
              return 20
            }
          })
          .attr("x", function(d) {
            if (d.size > 50) {
              return -150
            } else {
              return 10
            }
          })
          .attr("y", function(d) {
            if (d.size > 50) {
              return -5
            } else {
              return -10
            }
          })
          .style("fill", "#191919")
          .style("opacity", 0.5);
        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
          });

        nodeUpdate.select("path")
          .style("stroke", function(d) {
            return linkColor(d.colorCode);
          })
          // .style("fill", function(d){
          //   return linkColor(d.target.colorCode);
          // })
          .style("fill", function(d) {
            return linkColor(d.colorCode);
          })
          .style("opacity", 1)
          .attr("d", d3.svg.symbol()
            .size(function(d) {
              if (d.size >= 50) {
                return d.size = 0;
              } else if (d.size > 1) {
                return 300;
              } else {
                return 5;
              }
            })
            .type(function(d) {
              if (d.size >= 50) {
                return "square";
              } else {
                return "circle";
              }
            }));
        nodeUpdate.select("text")
          .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
          })
          .remove();

        nodeExit.select("circle")
          .attr("r", 1e-6);

        nodeExit.select("text")
          .style("fill-opacity", 1e-6);

        // Update the links
        var link = svg.selectAll("path.link")
          .data(links, function(d) {
            return d.target.id;
          });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
          .attr("class", "link")
          .attr("stroke-width", function(d) {
            return 1;
          })
          .attr("d", function(d) {
            var o = {
              x: source.x0,
              y: source.y0
            };
            return diagonal({
              source: o,
              target: o
            });
          })
          .attr("stroke", function(d) {
            return linkColor(d.target.colorCode);
          })
          .attr("stroke-dasharray", function(d) {
            return linkDash(d.target.colorCode);
          })

        // Transition links to their new position.
        link.transition()
          .duration(duration)
          .attr("d", function(d) {
            /* calculating the top shift */
            var source = {
              x: d.source.x - edge_weight(calculateLinkSourcePosition(d)),
              y: d.source.y
            };
            var target = {
              x: d.target.x,
              y: d.target.y
            };
            return diagonal({
              source: source,
              target: target
            });
          })
          .attr("stroke-width", function(d) {
            return edge_weight(d.target.size);
          });

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {
              x: source.x,
              y: source.y
            };
            return diagonal({
              source: o,
              target: o
            });
          })
          .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
          d.x0 = d.x;
          d.y0 = d.y;
        });
      }

      /**
       * Calculates the source y-axis position of the link.
       * @param {json structure} link
       */
      function calculateLinkSourcePosition(link) {
        targetID = link.target.id;
        var childrenNumber = link.source.children.length;
        var widthAbove = 0;
        for (var i = 0; i < childrenNumber; i++) {
          if (link.source.children[i].id == targetID) {
            // we are done
            widthAbove = widthAbove + link.source.children[i].size / 2;
            break;
          } else {
            // keep adding
            widthAbove = widthAbove + link.source.children[i].size
          }
        }
        return link.source.size / 2 - widthAbove;
      }

      /*
       * Toggle children on click.
       * @param {node} d
       */
      function click(d) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d);
      }

      /*
       * Collapses the node d and all the children nodes of d
       * @param {node} d
       */
      function collapse(d) {
        if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
      }

      /*
       * Collapses the node in the tree
       */
      function collapseAll(d) {
        root.children.forEach(collapse);
        update(root);
      }

      /*
       * Expands the node d and all the children nodes of d
       * @param {node} d
       */
      function expand(d) {
        if (d._children) {
          d.children = d._children;
          d._children = null;
        }
        if (d.children) {
          d.children.forEach(expand);
        }

      }
      /*
       * Expands all the nodes in the tree
       */
      function expandAll(d) {
        root.children.forEach(expand);
        update(root);
      }

      /*
      color set
      */
      function linkColor(linkCode) {
        switch (linkCode) {
          case 'connect':
            return '#acacac';
            break;
          case 'disconnect':
            return '#f18182';
            break;
        }
      }

      function linkDash(linkCode) {
        switch (linkCode) {
          case 'disconnect':
            return '0.3%'
            break;

        }
      }
    })
  })
})
