Ajax.Request.notifiers = {
 aboutToSendSomething:      new Notifier(),
 justGotSuccessfulResponse: new Notifier(),
 justGotFailureResponse:    new Notifier(),
 justGotExceptionResponse:  new Notifier(),
};

function doAjaxRequest(url, stuff) {
  Ajax.Request.notifiers.aboutToSendSomething.notify_all_observers();
  var onSuccess     = stuff.onSuccess;
  var onFailure     = stuff.onFailure;
  var onException   = stuff.onException;
  stuff.onSuccess   = function(transport) {Ajax.Request.notifiers.justGotSuccessfulResponse.notify_all_observers(); onSuccess(transport);};
  stuff.onFailure   = function()          {Ajax.Request.notifiers.justGotFailureResponse   .notify_all_observers(); onFailure();};
  stuff.onException = function(r, e)      {Ajax.Request.notifiers.justGotExceptionResponse .notify_all_observers(); onException(r, e);};
  return new Ajax.Request(url, stuff);
}
