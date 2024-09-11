
// By using Promises approach.
const asyncHandler = (requestHandler)=>{
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((error) => next(error))
    }
}


// By using Asyn Await approach.
const asyncHandler1 = (requestHandler) =>{
    return async(req,res,next,error)=>{
        try {
            await requestHandler(req,res,next);        
        } catch (error) {
            next(error);
        }
    } 
}



export {
    asyncHandler,
    asyncHandler1,
}