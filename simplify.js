module.exports = {
    getPostfix,
    simplify
};

function getPostfix(expression) {
    let postfix = "";
    // Remove spaces 
    expression = expression.replace(/\s/g,'');

    //Check infix               
    expression = checkInfix(expression);
    
    // Error handle if not balanced brackets 
    if (!balancedBrackets(expression))
    {
        postfix = "ERROR! There's a bracket error";
    }
    // Validate Expression
    else if (!validateExpression(expression)) {
        postfix = "ERROR! Non-valid expression.";
    }               
    else {              
        // Split based on operations 
        var charArray = expression.split('');

        // Convert infix to postfix 
        var toPostfix = infixToPostfix(charArray);    
        postfix = toPostfix;
    }

    return postfix;
}

function simplify(expression) {
    let result = "";

    // Remove spaces 
    expression = expression.replace(/\s/g,'');

    //Check infix               
    expression = checkInfix(expression);

    // Error handle if not balanced brackets 
    if (!balancedBrackets(expression))
    {
        result = "ERROR! There's a bracket error";
    }
    // Validate Expression
    else if (!validateExpression(expression)) {
        result = "ERROR! Non-valid expression.";
    }               
    else {           
        // Split based on operations 
        var charArray = expression.split('');

        // Convert infix to postfix 
        var postfix = infixToPostfix(charArray);                
        
        // Get number of operations in postfix 
        var count = operationNumber(postfix);
        
        var resultStack = new Stack();
        
        // For complex cases 
        if (count >= 2 && !postfix.includes('~')) {
            // Get number of * in postfix 
            var multCount = countMultiply(postfix);
            // Get number of + in postfix 
            var addCount = countAdd(postfix);

            
            // Associative Property 
            if (multCount > 1) {
                if (charArray[0] == '(') {
                    var length = postfix.length-1;
                    var firstPart = postfix[length];
                    var secondPart = '('+postfix[length-1] + postfix[length-2]+')';
                    result = firstPart + secondPart;
                }
                else {
                    var length = postfix.length-1;
                    var firstPart = '('+postfix[length] + postfix[length-1]+')';
                    var secondPart = postfix[length-2];
                    result = firstPart + secondPart;
                }
            }
            // 1 Addition and 1 Multiplication 
            // X + XY or X + YZ 
            else if (multCount == 1 && addCount == 1) {
                var hasDuplicates = (/([a-zA-Z]).*?\1/).test(postfix)        
                // X + XY or X(X+Y)
                if (hasDuplicates) {                                                
                    // Duplicate value 
                    var dupVal = stringParse(postfix); 
                    result = dupVal;                           
                }
                else {
                    // X(Y+Z) = XY + XZ 
                    // If there were brackets
                    if (checkBracket(charArray)) {
                        var length = postfix.length-1;
                        var firstValue = postfix[length];
                        var firstPair = firstValue + postfix[length-1];
                        var secondPair = firstValue + postfix[length-2];                                                                    
                        result = firstPair + '+' + secondPair;         
                    }
                    // X + YZ  = (X+Y)(X+Z)
                    else {                          
                        var length = postfix.length-1;
                        var firstValue = postfix[length];
                        var firstPair = '(' + firstValue + '+' + postfix[length-1] + ')';
                        var secondPair = '(' + firstValue + '+' + postfix[length-2] + ')';
                        result = firstPair + secondPair;
                    }
                }                       
            }
        }
        else if (count >= 2 && postfix.includes('~')) {
            // Get number of * in postfix 
            var multCount = countMultiply(postfix);
            // Get number of + in postfix 
            var addCount = countAdd(postfix);
            
            // (X + Y)(X + ~Y) or XY + X~Y
            if ((multCount == 2 && addCount == 1) || ( multCount == 1 && addCount == 2)) {
                var neg = charArray.indexOf('~');
                var value = charArray[neg-2];
                result = value; 
            }                       
        }
        else {                  
            // Convert postfix to result                
            for (var i = postfix.length - 1; i >= 0; i--) {
                //char is not operator yet
                if (!isOperator(postfix[i])) {
                    // 7. Involution Law  
                    // If ~~A
                    if ((postfix[i-2] == '~' && postfix[i-1] == '~')) {
                        resultStack.push(postfix[i]);
                        result += postfix[i]; 
                    }           
                    // If (~A+A)
                    else if (postfix[i-2] == '~' && postfix[i-1] != '~' && isOperator(postfix[i-1])) {
                        var val = postfix[i-2] + postfix[i];
                        resultStack.push(val);
                    }   
                    // If (A+~A)
                    // If it's a ~, then push both into one value (like be ~A for example) 
                    else if (postfix[i-2] != '~' && postfix[i-1] == '~') {
                        var val = postfix[i-1] + postfix[i];
                        resultStack.push(val);
                    }
                    else {
                        resultStack.push(postfix[i]);
                    }
                } 
                else if (postfix[i] == '~') {
                    // do nothing 
                }
                else {
                    var a = resultStack.pop().data;
                    var b = resultStack.pop().data;
                            
                    var simplified = checkPossibleSimp(a, b, postfix[i]);
                    if ((simplified == a + postfix[i] + b) || i == 0) {
                        result += simplified;
                    } 
                    else if (simplified == 0 || simplified == 1) {
                        result += simplified;
                    }
                    else {
                        resultStack.push(postfix);
                    }
                }
            }
        }
    }
    
    // Output simplified expression 
    return result;
}

// Check for possible simplifications 
function checkPossibleSimp(a, b, operator) {
    //0. Commutative law (done because of stack popping order)
    //1. Idempotent law
    if (a == b && (operator == '*' || operator == '+')) {
        return a;
    } 
    //2. Identity law (a * 0 = 0)
    else if ((a == '0' || b == '0') && operator == '*') {
        return '0';
    }
    //3. Identity law (a + 0 = a)
    else if (((a == '0' && b != '0') || (a != '0' && b == '0')) && operator == '+') {
        return a == '0' ? b : a;
    }
    //4. Identity law (a + 1 = 1)
    else if ((a == '1' || b == '1') && operator == '+') {
        return '1';
    }
    //5. Identity law (a * 1 = a)
    else if (((a == '1' && b != '1') || (a != '1' && b == '1')) && operator == '*') {
        return a == '1' ? b : a;
    }   
    // 6. Complement Law 
    else if (a.match(/[~]/) || b.match(/[~]/)) {
        // Complement Law (A*~A = 0)
        if (operator == '*') {
            return 0;
        }
        // Complement Law (A+~A = 0)
        else {
            return 1;
        }
    }
    else {
        return a + operator + b;
    }
};

// Check if infix is error free 
function checkInfix(str) {
    var result = new Array;
    for (var i = 0; i < str.length; i++) {
        var element = str[i];
        if (i+1 < str.length && isLetter(element) && (isLetter(str[i+1]) || isNumber(str[i+1]) || str[i+1] == '~')) {
            result.push(element);
            result.push('*');
        }
        else {                  
            result.push(element);
        }
    }
    return result.join('');
}

// Converts infix expression to postfix 
function infixToPostfix(array) {
    var postfix = '', len = array.length; 
    var stack = new Stack();
    
    for (var i = 0; i < len; i++) {
        if (array[i].match(/[+\*\~]/)) {
            postfix += array[i];
        }
        else if (array[i] == ")" && i < len-1 && isLetter(array[i+1])) {
            postfix += "*";
        }
        else if (array[i] == "(" && i < len-1 && isLetter(array[i+1]) && i >= 1) {
            postfix += "*";
        }
        else if (array[i] == "(" && i < len-1 && array[i] == ")") {
            postfix += "*";
        }
        else if (array[i] === " ") {
            // do nothing 
        }
        else if (stack.size == 0) {
            stack.push(array[i]);
        }
        else {
            switch (array[i]) {
                default:
                    stack.push(array[i]);
                    break;
            }
        }
    }
    
    while (stack.size > 0) {
        postfix += stack.pop().data;
    }
    
    postfix = postfix.replace('(', "");
    postfix = postfix.replace(')', "");
    postfix = postfix.replace(')', "");
    return postfix;
};

// Validates expression 
function validateExpression(str) {
  var operators = ['+', '.', '-', '/', '^'];
  var operands = ['A', 'B', 'C', 'X', 'Y', 'Z', '1', '0', '~'];

  for (let i = 0; i < str.length; i++) {
    if (str[i] === '~') {
      if (operators.includes(str[i-1]) && operands.includes(str[i+1])) {
        continue;
      }
    } else if (operators.includes(str[i])) {
      if (operands.includes(str[i-1]) && operands.includes(str[i+1])) {
        continue;
      }
      return false;
    }
  }
  return true;
}

// Finds number of operations 
function operationNumber(str) {
    var operators = ['+', '.', '-', '/', '^', '*'];
    var count = 0;
    for (var i = 0; i < str.length-1; i++) {
        if (operators.includes(str[i])) {
            count++;
        }
    }
    return count;
}

// Count multiplication count 
function countMultiply(str) {
    var operators = ['*'];
    var count = 0;
    for (var i = 0; i < str.length-1; i++) {
        if (operators.includes(str[i])) {
            count++;
        }
    }
    return count;
}

// Check addition count 
function countAdd(str) {
    var operators = ['+'];
    var count = 0;
    for (var i = 0; i < str.length-1; i++) {
        if (operators.includes(str[i])) {
            count++;
        }
    }
    return count;
}

// Check bracket 
function checkBracket(str) {
    var operators = ['('];
    var count = 0;
    for (var i = 0; i < str.length-1; i++) {
        if (operators.includes(str[i])) {
            return true;
        }
    }
    return false;
}

// Check if repetition in string 
function checkString(text,index){
    if((text.length - index)==0 ){ //stop condition
        return false; 
    }else{
        return checkString(text,index + 1) 
        || text.substr(0, index).indexOf(text[index])!=-1;
    }
}

// Find duplicate values 
function stringParse(string){
  var arr = string.split("");
  for(var i = 0; i<arr.length-1; i++){
    var letterToCompare = arr[i];
    var j= i+1;
    if(letterToCompare === arr[j]){
      return letterToCompare;
    }    
  }  
}

// Checks if brackets are balanced 
function balancedBrackets(str) {
    var depth = 0;
    for (var i in str) {
        if (str[i] == '(') {
            depth++; 
        } else if (str[i] == ')') {
            depth--;
        }
        
        if (depth < 0) {
            return false; 
        }
    }
    if (depth > 0) {
        return false;
    }
    return true;
};

// Return true if letter/char
function isLetter(str) {
  return str.length === 1 && str.match(/[a-z]/i);
};

function isNumber(str) {
    return str.length === 1 && str.match('^[0-9]+$');
}

// Return true if an operator 
function isOperator(x) {
    switch(x) {
        case '~':
        case '+':
        case '.':
        case '*':
        case '(':
        case ')':
            return true;
        default:
            return false; 
    }
};

// Stack  
var Stack = function(){
  this.top = null;
  this.size = 0;
};

// Node
var Node = function(data){
  this.data = data;
  this.previous = null;
};

// Push in Stack 
Stack.prototype.push = function(data) {
  var node = new Node(data);

  node.previous = this.top;
  this.top = node;
  this.size += 1;
  return this.top;
};

// Pop in Stack 
Stack.prototype.pop = function() {
  temp = this.top;
  this.top = this.top.previous;
  this.size -= 1;
  return temp;
};

// Check if Stack is empty 
Stack.prototype.isEmpty = function(array) {
    if (array.length > 0) {
        return false;
    }
    return true;
}