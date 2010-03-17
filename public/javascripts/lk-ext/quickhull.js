// http://en.literateprograms.org/Quickhull_(Javascript)


function getDistant(cpt, bl) {
    var Vy = bl[1].x - bl[0].x;
    var Vx = bl[0].y - bl[1].y;
    return Vx * (cpt.x - bl[0].x) + Vy * (cpt.y - bl[0].y);
}


function findMostDistantPointFromBaseLine(baseLine, points) {
    var maxD = 0;
    var maxPt = null;
    var newPoints = [];
    for (var i = 0, n = points.length; i < n; ++i) {
        var p = points[i];
        var d = getDistant(p, baseLine);
        if (d > 0) {
          newPoints.push(p);
          if (d > maxD) {
            maxD = d;
            maxPt = p;
          }
        }
    } 
    return {maxPoint: maxPt, newPoints: newPoints};
}


function buildConvexHull(baseLine, points) {
    
  var convexHullBaseLines = [];
  var t = findMostDistantPointFromBaseLine(baseLine, points);
  if (t.maxPoint) { // if there is still a point "outside" the base line
    convexHullBaseLines = convexHullBaseLines.concat( buildConvexHull( [baseLine[0],  t.maxPoint], t.newPoints) );
    convexHullBaseLines = convexHullBaseLines.concat( buildConvexHull( [t.maxPoint,  baseLine[1]], t.newPoints) );
    return convexHullBaseLines;
  } else {  // if there is no more point "outside" the base line, the current base line is part of the convex hull
    return [baseLine];
  }    
}



function getConvexHull(points) {
    // find first baseline
    var maxX, minX;
    var maxPt, minPt;
    points.each(function(p) {
        if (maxX === undefined || p.x > maxX) {
            maxPt = p;
            maxX = p.x;
        }
        if (minX === undefined || p.x < minX) {
            minPt = p;
            minX = p.x;
        }
    });
    return buildConvexHull([minPt, maxPt], points).concat(buildConvexHull([maxPt, minPt], points));
}
