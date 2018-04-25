
const tableDDL = {
    users: 'create table users (user_name text, user_id num primary key)',
    user_jobs: 'create table user_jobs (user_id num, job text, primary key (user_id, job))'
};
for (let key in tableDDL) {
    prepareDB(tableDDL[key], key);
}

module.exports = function (config) {
    const db = new sqlite3.Database(path.join(__dirname, '.sqllitedb'));
    return {
        findUser(user_id) {

        },
        findJobsByUserId(user_id) {
            return new Promise(resolve => {
                db.all('select * from user_jobs where user_id = $id', { $id: user_id }, (err, result) => {
                    result(result);
                });
            });
            
        },
        findAllJobs(name) {

        }
    };
}