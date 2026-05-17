/*
    MXS Agent client for Autodesk 3ds Max.

    Usage:
    1. Start Python server:
       python tools/3dsmax_mxs_agent/server.py
    2. In 3ds Max: Scripting > Run Script... > choose this file.
    3. Press Start. The client polls /next.txt and executes returned MaxScript.
*/

global MXSAgent_serverUrl = "http://127.0.0.1:8787"
global MXSAgent_isBusy = false

fn MXSAgent_b64Decode value =
(
    local bytes = (dotNetClass "System.Convert").FromBase64String value
    (dotNetClass "System.Text.Encoding").UTF8.GetString bytes
)

fn MXSAgent_b64Encode value =
(
    local bytes = (dotNetClass "System.Text.Encoding").UTF8.GetBytes value
    (dotNetClass "System.Convert").ToBase64String bytes
)

fn MXSAgent_getField payload fieldName =
(
    local prefix = fieldName + ":"
    local lines = filterString payload "\n"
    for line in lines do
    (
        if matchPattern line pattern:(prefix + "*") ignoreCase:false do
        (
            return substring line (prefix.count + 1) (line.count - prefix.count)
        )
    )
    undefined
)

fn MXSAgent_httpGet url =
(
    local wc = dotNetObject "System.Net.WebClient"
    wc.Headers.Add "User-Agent" "MXSAgent-3dsMax"
    try
    (
        wc.DownloadString url
    )
    catch
    (
        undefined
    )
)

fn MXSAgent_httpPostText url body =
(
    local wc = dotNetObject "System.Net.WebClient"
    wc.Headers.Add "Content-Type" "text/plain; charset=utf-8"
    wc.Headers.Add "User-Agent" "MXSAgent-3dsMax"
    try
    (
        wc.UploadString url "POST" body
    )
    catch
    (
        undefined
    )
)

fn MXSAgent_sendResult jobId ok message =
(
    local body = "id:" + jobId + "\n" + "ok:" + (if ok then "1" else "0") + "\n" + "message64:" + (MXSAgent_b64Encode message) + "\n"
    MXSAgent_httpPostText (MXSAgent_serverUrl + "/result.txt") body
)

fn MXSAgent_pollOnce =
(
    if MXSAgent_isBusy do return false
    MXSAgent_isBusy = true

    local payload = MXSAgent_httpGet (MXSAgent_serverUrl + "/next.txt?client=3dsmax")
    if payload == undefined do
    (
        MXSAgent_isBusy = false
        return false
    )

    local jobId = MXSAgent_getField payload "id"
    local script64 = MXSAgent_getField payload "script64"
    if jobId == undefined or script64 == undefined do
    (
        MXSAgent_isBusy = false
        return false
    )

    local script = MXSAgent_b64Decode script64
    try
    (
        execute script
        MXSAgent_sendResult jobId true "executed"
        format "MXS Agent executed job %\n" jobId
    )
    catch err
    (
        local msg = err as string
        MXSAgent_sendResult jobId false msg
        format "MXS Agent job % failed: %\n" jobId msg
    )

    MXSAgent_isBusy = false
    true
)

try(destroyDialog MXSAgentRollout)catch()

rollout MXSAgentRollout "MXS Agent" width:360
(
    editText edtServer "Server" text:MXSAgent_serverUrl width:330
    button btnStart "Start" width:80 across:3
    button btnStop "Stop" width:80
    button btnPoll "Poll Now" width:90
    label lblState "Stopped" width:330
    timer pollTimer interval:900 active:false

    on btnStart pressed do
    (
        MXSAgent_serverUrl = edtServer.text
        pollTimer.active = true
        lblState.text = "Running: " + MXSAgent_serverUrl
    )

    on btnStop pressed do
    (
        pollTimer.active = false
        lblState.text = "Stopped"
    )

    on btnPoll pressed do
    (
        MXSAgent_serverUrl = edtServer.text
        MXSAgent_pollOnce()
    )

    on pollTimer tick do
    (
        MXSAgent_pollOnce()
    )
)

createDialog MXSAgentRollout
