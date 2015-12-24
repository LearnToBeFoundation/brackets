/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */

define(function (require, exports, module) {
    "use strict";

    //pubSubService must implement:
    //sub(eventName, callback)   : subscribes, runs the callback when the named event is pub'd
    //pub(eventName, parameters) : publishes the parameters (must be JSON object or string) to
    //                             the specified event name
    //unsub(eventName)           : unsubscribes to the event
    function Collaborator(pubSubService){
        this._pubSub = pubSubService;
    }

    Collaborator.prototype.makeDocumentCollaborative = function(doc){
        var collab = this;
        this._pubSub.sub(documentChannel(doc, "change"), function(newText){
            doc.refreshText(newText, new Date());
        });

        doc.on("documentChange", function(e, changedDoc, a){
            collab._pubSub.pub(documentChannel(changedDoc, "change"), changedDoc.getText());
        });
    };

    Collaborator.prototype.makeFileSystemCollaborative = function(filesystem){
        // preserve this-context, since the 'on' event binders change them
        var collab = this;

        filesystem.on("rename", function(e, oldName, newName){
            collab._pubSub.pub(fileSystemChannel(filesystem, "rename"), {
                oldName: oldName,
                newName: newName
            });
        });

        filesystem.on("change", function(e, entry, added, removed){
            collab._pubSub.pub(fileSystemChannel(filesystem, "rename"), {
                entry: entry,
                added: added,
                removed: removed
            });
        });

        collab._pubSub.sub(fileSystemChannel(filesystem, "rename"), function(filechange){
            filesystem._handleRename(filechange.oldName, filechange.newName);
        });

        collab._pubSub.sub(fileSystemChannel(filesystem, "change"), function(filechange){
            filesystem._enqueueExternalChange(filechange.entry, filechange.added, filechange.removed);
        });
    };

    function fileSystemChannel(filesystem, subEvent){
        return channelName(filesystem._watchedRoots[0]) + (subEvent ? ":" + subEvent : "");
    }

    function documentChannel(doc, subEvent){
        return channelName(doc.file._path) + (subEvent ? ":" + subEvent : "");
    }

    function channelName(uniquePart){
        return "collab" + (uniquePart ? ":" + uniquePart : "");
    }

    // Export public API
    module.exports = Collaborator;
});
