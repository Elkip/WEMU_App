/**
 * Google Analytics and Chartbeat tag merger for NPR Stations
 * Tag Version  : tags_merged_js_001
 * Publish ID   : 858
 * Publish Date : 2019-11-05 00:16:14
 *
 */

function dinamicallyLoadGaChartbeatScripts() {
  var s = document.getElementsByTagName('script')[0];

  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src = '//stream.publicbroadcasting.net/analytics/ga_aafj.js';
  s.parentNode.insertBefore(ga, s);

  var chartbeat = document.createElement('script');
  chartbeat.type = 'text/javascript';
  chartbeat.async = true;
  chartbeat.src = '//stream.publicbroadcasting.net/analytics/chartbeat_aafj.js';
  s.parentNode.insertBefore(chartbeat, s);
}

dinamicallyLoadGaChartbeatScripts();