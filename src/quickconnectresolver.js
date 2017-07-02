var QuickConnect = function(id) {
    var quickConnectID = id;
    var requestQueue = [];

    function determineServerURL(success, fail) {
        getServerData(function(response) {
            if (response[0].server && response[0].service) {
                createTunnelRequests(response[0], function(tunnelResponse) {
                    if (tunnelResponse) {
                        var tunnelRelayIp = tunnelResponse.service.relay_ip;
                        var tunnelRelayPort = tunnelResponse.service.relay_port;
                        if (tunnelRelayIp) {
                            var pingPong = createPingPongCall(tunnelRelayIp, tunnelRelayPort);
                            requestQueue.push(pingPong);
                        }
                    }

                    createCallDSMDirectlyRequests(response[0]);
                    createCallRelayRequests(response[0]);


                    processRequestQueue(function(url) {
                        if (success)
                            success(url);
                    }, function(error) {
                        if (fail)
                            fail(error);
                    });
                });
            } else {
                if (fail)
                    fail("No server found");
            }
        });
    }

    function processRequestQueue(success, error) {
        for (var i = 0; i < requestQueue.length; i++) {
            var request = requestQueue[i];

            request.onload = function() {
                if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                    var responseObject = JSON.parse(this.responseText);
                    if (responseObject.success) {
                        for (var j = 0; j < requestQueue.length; j++) {
                            var activeRequest = requestQueue[j];
                            if (activeRequest !== this) {
                                activeRequest.abort();
                            }
                        }
                        success('https://' + this.ip + ':' + this.port);
                    }
                }
            }

            request.send(null);
        }
    }

    function getServerData(done) {
        var serverRequestData = [{
            "version": 1,
            "command": "get_server_info",
            "stop_when_error": "false",
            "stop_when_success": "false",
            "id": "dsm_portal_https",
            "serverID": quickConnectID
        }];

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://synologyquickconnectid.herokuapp.com/server.php', true);

        xhr.onload = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                var serversResponse = JSON.parse(xhr.responseText);
                done(serversResponse);
            }
        };

        xhr.send(JSON.stringify(serverRequestData));

        return xhr;
    }

    function createTunnelRequests(serverData, done, fail) {
        if (serverData.env.control_host) {
            var serverRequestData = {
                "command": "request_tunnel",
                "version": 1,
                "serverID": quickConnectID,
                "id": "dsm_portal_https"
            }

            var xhr = new XMLHttpRequest();
            xhr.open('POST', "https://synologyquickconnectid.herokuapp.com/server.php?host=" + serverData.env.control_host, true);

            xhr.onload = function() {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    var serversResponse = JSON.parse(xhr.responseText);
                    done(serversResponse);
                } else {
                    fail();
                }
            };

            xhr.send(JSON.stringify(serverRequestData));
        } else {
            done();
        }
    }

    function createCallRelayRequests(serverData) {
        var relayIp = serverData.service.relay_ip;
        var relayPort = serverData.service.relay_port;

        if (relayIp) {
            var pingPong = createPingPongCall(relayIp, relayPort);
            requestQueue.push(pingPong);
        }
    }

    function createCallDSMDirectlyRequests(serverData) {
        var port = serverData.service.port;
        var externalPort = serverData.service.ext_port;

        if (serverData.server.interface) {
            for (var i = 0; i < serverData.server.interface.length; i++) {
                var serverInterface = serverData.server.interface[i];

                if (serverInterface.ip) {
                    var pingPong = createPingPongCall(serverInterface.ip, port);
                    requestQueue.push(pingPong);
                }

                if (serverInterface.ipv6 && serverInterface.ipv6.length > 0) {
                    for (var j = 0; j < serverInterface.ipv6.length; j++) {

                        var ipv6 = serverInterface.ipv6[i];
                        var ipv6PingPong = createPingPongCall('[' + ipv6.address + ']', port);
                        requestQueue.push(ipv6PingPong);
                    }
                }

            }
        }
    }

    function createPingPongCall(ip, port) {
        var xhr = new XMLHttpRequest();
        xhr.ip = ip
        xhr.port = port;

        xhr.open('GET', 'https://' + ip + ":" + port + "/webman/pingpong.cgi?action=cors", true);

        return xhr;
    }

    return {
        "determineServerURL": determineServerURL
    }
}
