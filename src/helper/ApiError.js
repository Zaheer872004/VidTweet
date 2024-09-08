class ApiError extends Error {
    constructor(
        statusCode = 400,
        message = "Something went wrong",
        error = [],
        stack = "",

    ){
        super(message);
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.error = error
        
        if(stack){
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { 
    ApiError
}