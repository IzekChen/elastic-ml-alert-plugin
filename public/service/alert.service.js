export default function AlertService($http, mlaConst, parse, EsDevToolService, es, script, scriptSlack, scriptLine) {
  const PATHS = mlaConst.paths;
  var CPATH = '..' + PATHS.console.path;
  var CMETHOD = PATHS.console.method;
  function checkScript(scriptName, scriptSource, successCallback, errorCallback) {
    let queryString = EsDevToolService.createQuery(PATHS.getScript.method, PATHS.getScript.path + scriptName);
    let uri = CPATH + '?' + queryString;
    $http.post(uri).then(successCallback, function(error) {
      console.info("try to put script " + scriptName);
      let putScriptQuery = EsDevToolService.createQuery(PATHS.putScript.method, PATHS.putScript.path + scriptName);
      let putScriptUri = CPATH + '?' + putScriptQuery;
      let body = {
        script: {
          lang: "painless",
          source: scriptSource
        }
      };
      $http.post(putScriptUri, body).then(successCallback, errorCallback);
    });
  }
  return {
    /**
     * Get the list of alerts for elastic-ml-alart plugin
     * @param successCallback success callback
     * @param errorCallback callback for failure
     */
    searchList: function (successCallback, errorCallback) {
      var result = es.search({
        index: ".watches",
        body: {
          query: {
            term: {
              "metadata.alert_type": "mla"
            }
          },
          "sort": [
            {
              "_id": {
                "order": "asc"
              }
            }
          ]
        }
      }).then(successCallback, errorCallback);
    },
    /**
     * Get alert information by alertId
     * @param alertId Alert ID
     * @param successCallback success callback
     * @param errorCallback callback for failure
     */
    search: function (alertId, successCallback, errorCallback) {
      let queryString = EsDevToolService.createQuery(PATHS.getWatch.method, PATHS.getWatch.path + alertId);
      let uri = CPATH + '?' + queryString;
      $http.post(uri).then(successCallback, errorCallback);
    },
    /**
     * Delete alerts
     * @param alertIds list of AlertIDs
     * @param successCallback success callback
     * @param errorCallback callback for failure
     */
    delete: function (alertIds, successCallback, errorCallback) {
      var totalCount = alertIds.length;
      var successCount = 0;
      var failCount = 0;
      function deleteOneAlert(alertId) {
        const promise = new Promise((resolve, reject) => {
          let queryString = EsDevToolService.createQuery(PATHS.deleteWatch.method, PATHS.deleteWatch.path + alertId);
          let uri = CPATH + '?' + queryString;
          $http.post(uri).then(function () {
            successCount++;
            resolve();
          }, function (err) {
            console.error(err);
            failCount++;
            resolve();
          });
        });
        return promise;
      }
      var del = deleteOneAlert(alertIds[0]);
      for (let i = 1; i < totalCount; i++) {
        del = del.then(() => deleteOneAlert(alertIds[i]));
      }
      return del.then(function () {
        if (successCount > 0) {
          successCallback(successCount, totalCount);
        }
        if (failCount > 0) {
          errorCallback(failCount, totalCount);
        }
      });
    },
    /**
     * Activate alerts
     * @param alertIds list of AlertIDs
     * @param successCallback success callback
     * @param errorCallback callback for failure
     */
    activate: function (alertIds, successCallback, errorCallback) {
      var totalCount = alertIds.length;
      var successCount = 0;
      var failCount = 0;
      function activateOneAlert(alertId) {
        const promise = new Promise((resolve, reject) => {
          let queryString = EsDevToolService.createQuery(PATHS.editWatch.method, PATHS.editWatch.path + alertId + "/_activate");
          let uri = CPATH + '?' + queryString;
          $http.post(uri).then(function () {
            successCount++;
            resolve();
          }, function (err) {
            console.error(err);
            failCount++;
            resolve();
          });
        });
        return promise;
      }
      var edit = activateOneAlert(alertIds[0]);
      for (let i = 1; i < totalCount; i++) {
        edit = edit.then(() => activateOneAlert(alertIds[i]));
      }
      return edit.then(function () {
        if (successCount > 0) {
          successCallback(successCount, totalCount);
        }
        if (failCount > 0) {
          errorCallback(failCount, totalCount);
        }
      });
    },
    /**
     * Deactivate alerts
     * @param alertIds list of AlertIDs
     * @param successCallback success callback
     * @param errorCallback callback for failure
     */
    deactivate: function (alertIds, successCallback, errorCallback) {
      var totalCount = alertIds.length;
      var successCount = 0;
      var failCount = 0;
      function deactivateOneAlert(alertId) {
        const promise = new Promise((resolve, reject) => {
          let queryString = EsDevToolService.createQuery(PATHS.editWatch.method, PATHS.editWatch.path + alertId + "/_deactivate");
          let uri = CPATH + '?' + queryString;
          $http.post(uri).then(function () {
            successCount++;
            resolve();
          }, function (err) {
            console.error(err);
            failCount++;
            resolve();
          });
        });
        return promise;
      }
      var edit = deactivateOneAlert(alertIds[0]);
      for (let i = 1; i < totalCount; i++) {
        edit = edit.then(() => deactivateOneAlert(alertIds[i]));
      }
      return edit.then(function () {
        if (successCount > 0) {
          successCallback(successCount, totalCount);
        }
        if (failCount > 0) {
          errorCallback(failCount, totalCount);
        }
      });
    },
    /**
     * Update alerts
     * @param alertIds list of AlertIDs
     * @param successCallback success callback
     * @param errorCallback callback for failure
     */
    bulkUpdate: function (alertIds, input, successCallback, errorCallback) {
      var totalCount = alertIds.length;
      var successCount = 0;
      var failCount = 0;
      function saveAlert(res) {
        let data = res["data"];
        let alertId = data._id;
        let body = data.watch;
        if (input.editMail && input.mailAddressTo[0].value != "") {
          body.actions.send_email = mlaConst.mailAction;
          body.actions.send_email.email.to = input.mailAddressTo.map(item => item.value);
          body.actions.send_email.email.cc = input.mailAddressCc.map(item => item.value);
          body.actions.send_email.email.bcc = input.mailAddressBcc.map(item => item.value);
        }
        if (input.editSlack && input.slackTo[0].value != "") {
          body.actions.notify_slack = mlaConst.slackAction;
          body.actions.notify_slack.slack.message.to = input.slackTo.map(item => item.value);
        }
        if (input.editLine && input.lineNotifyAccessToken != "") {
          body.actions.notify_line = mlaConst.lineAction;
          body.metadata.line_notify_access_token = input.lineNotifyAccessToken;
        }
        if (input.editMail && input.mailAddressTo[0].value == "" && body.actions.send_email && (body.actions.notify_slack || body.actions.notify_line)) {
          delete body.actions.send_email;
        }
        if (input.editSlack && input.slackTo[0].value == "" && (body.actions.send_email || body.actions.notify_line) && body.actions.notify_slack) {
          delete body.actions.notify_slack;
        }
        if (input.editLine && input.lineNotifyAccessToken == "" && (body.actions.send_email || body.actions.notify_slack) && body.actions.notify_line) {
          delete body.actions.notify_line;
          body.metadata.line_notify_access_token = "";
        }
        if (input.editDashboard) {
          body.metadata.link_dashboards = input.linkDashboards;
        }
        let queryString = EsDevToolService.createQuery(PATHS.editWatch.method, PATHS.editWatch.path + alertId);
        let uri = CPATH + '?' + queryString;
        return $http.post(uri, body);
      }
      function updateOneAlert(alertId) {
        const promise = new Promise((resolve, reject) => {
          let queryString = EsDevToolService.createQuery(PATHS.getWatch.method, PATHS.getWatch.path + alertId);
          let uri = CPATH + '?' + queryString;
          $http.post(uri).then(function (res) {
            saveAlert(res).then(function() {
              successCount++;
              resolve();
            }, function (err) {
              console.error(err);
              failCount++;
              resolve();
            });
          }, function (err) {
            console.error(err);
            failCount++;
            resolve();
          });
        });
        return promise;
      }
      var edit = updateOneAlert(alertIds[0], input);
      for (let i = 1; i < totalCount; i++) {
        edit = edit.then(() => updateOneAlert(alertIds[i], input));
      }
      return edit.then(function () {
        if (successCount > 0) {
          successCallback(successCount, totalCount);
        }
        if (failCount > 0) {
          errorCallback(failCount, totalCount);
        }
      });
    },
    /**
     * check if painless script exists
     * @param successCallback callback function for success
     * @param errorCallback callback function for failure
     */
    checkScripts: function (successCallback, errorCallback) {
      let scriptForMail = mlaConst.names.scriptForMail;
      let scriptForSlack = mlaConst.names.scriptForSlack;
      let scriptForLine = mlaConst.names.scriptForLine;
      checkScript(scriptForMail, script, function() {
        checkScript(scriptForSlack, scriptSlack, function() {
          checkScript(scriptForLine, scriptLine, successCallback, errorCallback);
        }, errorCallback);
      }, errorCallback);
    },
    /**
     * Save an alert
     * @param metadata metadata of the alert
     * @param successCallback success callback
     * @param errorCallback callback for failure
     */
    save: function (metadata, successCallback, errorCallback) {
      let queryString = EsDevToolService.createQuery(PATHS.editWatch.method, PATHS.editWatch.path + metadata.alertId);
      let uri = CPATH + '?' + queryString;
      let body = JSON.parse(JSON.stringify(mlaConst.alertTemplate));
      if (metadata.sendMail) {
        // templateの{{#toJson}}が使えなかったので直接入れる
        body.actions.send_email.email.to = metadata.mailAddressTo.map(item => item.value);
        if (metadata.mailAddressCc.length > 0) {
          body.actions.send_email.email.cc = metadata.mailAddressCc.map(item => item.value);
        }
        if (metadata.mailAddressBcc.length > 0) {
          body.actions.send_email.email.bcc = metadata.mailAddressBcc.map(item => item.value);
        }
      } else {
        delete body.actions.send_email;
      }
      if (metadata.notifySlack) {
        body.actions.notify_slack.slack.message.to = metadata.slackTo.map(item => item.value);
        if (metadata.slackAccount != '') {
          body.actions.notify_slack.slack.account = metadata.slackAccount;
        }
      } else {
        delete body.actions.notify_slack;
      }
      if (metadata.notifyLine) {
        body.metadata.line_notify_access_token = metadata.lineNotifyAccessToken;
      } else {
        delete body.actions.notify_line;
      }
      body.metadata.job_id = metadata.mlJobId;
      body.metadata.description = metadata.description;
      body.metadata.subject = metadata.subject;
      body.metadata.link_dashboards = metadata.linkDashboards;
      body.metadata.link_saved_searches = metadata.linkSavedSearches;
      body.metadata.threshold = metadata.threshold;
      body.metadata.detect_interval = metadata.detectInterval;
      body.metadata.kibana_display_term = metadata.kibanaDisplayTerm;
      body.metadata.kibana_url = metadata.kibanaUrl;
      body.metadata.locale = metadata.locale;
      body.metadata.ml_process_time = metadata.mlProcessTime;
      body.metadata.filterByActualValue = metadata.filterByActualValue;
      body.metadata.actualValueThreshold = metadata.actualValueThreshold;
      body.metadata.compareOption = metadata.compareOption;
      if (metadata.scheduleKind === 'cron') {
        body.trigger.schedule = {
          cron: metadata.triggerSchedule
        };
      }
      if (metadata.filterByActualValue) {
        let rangeCondition = {
          "range": {
            "actual": {}
          }
        };
        rangeCondition.range.actual[metadata.compareOption.compareType] = "{{ctx.metadata.actualValueThreshold}}";
        body.input.search.request.body.query.bool.must.push(rangeCondition);
      }
      $http.post(uri, body).then(successCallback, errorCallback);
    },

    calculateMlProcessTime: function (job, datafeed) {
      let bucketSpan = job.analysis_config.bucket_span;
      let frequency = datafeed.frequency ? datafeed.frequency : bucketSpan;
      let queryDelay = datafeed.query_delay;
      let totalDelaySeconds = Math.ceil((parse(bucketSpan) + parse(frequency) + parse(queryDelay) + parse('30s')) / 1000);
      return `${totalDelaySeconds}s`;
    },

    calculateKibanaDisplayTerm: function (job) {
      let bucketSpan = job.analysis_config.bucket_span;
      let kibanaDisplayTerm = 2 * parse(bucketSpan) / 1000;
      return kibanaDisplayTerm;
    }
  };
}