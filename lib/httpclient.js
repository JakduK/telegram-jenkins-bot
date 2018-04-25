module.exports.postJson = function (config) {
    return new Promise(resolve => {
        const paramsSerialized = JSON.stringify(params);
        const options = {
            hostname: config.host,
            path: `/bot${config.token}${path}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf8',
                'Content-Length': Buffer.byteLength(paramsSerialized)
            }
        };
        const req = https.request(options, async res => {
            const data = await prase.json({ req: res });
            resolve(res, data);
        });

        req.write(paramsSerialized);
        req.end();
    });
}