'use strict';
const api = require('./common/api');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

module.exports = async (activity) => {
  try {
    var data = {};

    // extract _action from Request
    var _action = getObjPath(activity.Request, "Data.model._action");
    if (_action) {
      activity.Request.Data.model._action = {};
    } else {
      _action = {};
    }

    switch (activity.Request.Path) {
      case "create":
      case "submit":
        const form = _action.form;
        api.initialize(activity);
        api.initOrgId();
        var response = await api.post('/tickets ', {
          body: {
            "subject": form.subject,
            "description": form.description,
            "departmentId": form.departments,
            "contactId": form.contacts
          }
        });

        //cant add field for ticket id because I cant get response since account is suspended
        var comment = T(activity, "Ticket {0} created.");
        data = getObjPath(activity.Request, "Data.model");
        data._action = {
          response: {
            success: true,
            message: comment
          }
        };
        break;

      default:
        var fname = __dirname + path.sep + "common" + path.sep + "ticket-create.form";
        var schema = yaml.safeLoad(fs.readFileSync(fname, 'utf8'));

        api.initialize(activity);
        await api.initOrgId();

        const messagePromises = [];
        messagePromises.push(api("/departments?isEnabled=true"));
        messagePromises.push(api("/contacts?include=accounts"));
        const messagesResponses = await Promise.all(messagePromises);

        for (let i = 0; i < messagesResponses.length; i++) {
          if ($.isErrorResponse(activity, messagesResponses[i])) return;
        }
        
        const departments = messagesResponses[0];
        const contacts = messagesResponses[1];

        schema.properties.departments.default = null;
        schema.properties.departments.xvaluelist = [];

        for (let i = 0; i < departments.body.data.length; i++) {
          const department = departments.body.data[i];

          schema.properties.departments.xvaluelist.push({
            value: department.id,
            title: department.name
          });

          if (!schema.properties.departments.default) {
            schema.properties.departments.default = department.id;
          }
        }

        schema.properties.contacts.default = null;
        schema.properties.contacts.xvaluelist = [];

        for (let i = 0; i < contacts.body.data.length; i++) {
          const contact = contacts.body.data[i];

          schema.properties.contacts.xvaluelist.push({
            value: contact.id,
            title: contact.firstName ? contact.firstName + " " + contact.lastName : contact.lastName
          });

          if (!schema.properties.contacts.default) {
            schema.properties.contacts.default = contact.id;
          }
        }

        data.title = T(activity, "Create Zohodesk Ticket");
        data.formSchema = schema;
        // initialize form subject with query parameter (if provided)
        if (activity.Request.Query && activity.Request.Query.query) {
          data = {
            form: {
              subject: activity.Request.Query.query
            }
          };
        }
        data._actionList = [{
          id: "create",
          label: T(activity, "Create Ticket"),
          settings: {
            actionType: "a"
          }
        }];
        break;
    }
    // copy response data
    activity.Response.Data = data;
  } catch (error) {
    // handle generic exception
    $.handleError(activity, error);
  }

  function getObjPath(obj, path) {

    if (!path) return obj;
    if (!obj) return null;

    var paths = path.split('.'),
      current = obj;

    for (var i = 0; i < paths.length; ++i) {
      if (current[paths[i]] == undefined) {
        return undefined;
      } else {
        current = current[paths[i]];
      }
    }
    return current;
  }
};
