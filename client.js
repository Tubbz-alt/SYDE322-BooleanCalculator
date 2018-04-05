// Refactor method - Replace magic numbers with Symbolic Constants 
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

function authenticate() {
    axios.defaults.withCredentials = true;

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    axios.post('http://localhost:8080/authenticate', {
        'username': username,
        'password': password
    })
    .then(function (res) {
        console.log(res);
        window.localStorage.accessToken = res.data.token;
        window.location.assign('http://localhost:3000/home');
    })
    .catch (function (err) {
        console.error(err);
        document.getElementById('errorMessage').style.visibility = 'visible';
    });
}

function postResult() {
    axios.defaults.withCredentials = true;

    var expression = document.getElementById('expression').value;
    if (expression != "") {
        const token = window.localStorage.getItem('accessToken');

        axios.post('http://localhost:8080/result', {'expression': expression}, {headers: {'Authorization': "Bearer " + token}})
        .then(function (res) {
            document.getElementById('simplifiedExpression').value = res.data;
        })
        .catch (function (err) {
            console.error(err);
    
            if (err.response.status === UNAUTHORIZED) {
                window.location.assign('http://localhost:3000/login');
            }
        });
    }
}

function postPostfix() {
    axios.defaults.withCredentials = true;

    var expression = document.getElementById('expression').value;    
    if (expression !== "") {
        const token = window.localStorage.getItem('accessToken');

        axios.post('http://localhost:8080/postfix', {'expression': expression}, {headers: {'Authorization': "Bearer " + token}})
        .then(function (res) {
            document.getElementById('postfix').value = res.data;
        })
        .catch (function (err) {
            console.error(err);
    
            if (err.response.status === UNAUTHORIZED) {
                window.location.assign('http://localhost:3000/login');
            } else if (err.response.status === FORBIDDEN) {
                document.getElementById('premiumMessage').style.visibility = 'visible';
            }
        });
    }
}