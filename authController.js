const User=require('../models/userModel')
const ErrorHandler=require('../utils/errorHandler');
const catchAsyncError=require('../middlewares/catchAsyncError');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const crypto =require("crypto")




exports.registreUser=catchAsyncError(async(req,res,next)=>{
    const {email,name,password,role}=req.body;
    const user=await User.create({
        name,
        email,
        password,
        role:role||'user',
        avatar:req.file?req.file.filename:null
    })
    sendToken(user,200,res)
})
exports.getUserProfile=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.user.id);
    res.status(200).json({
        success:true,
        user
    })
})
exports.loginUser=catchAsyncError(async(req,res,next)=>{
    const {email,password}=req.body;
    if(!email||!password)
        return next(new ErrorHandler("S'il vous plaît enter votre email ou votre mot de passe",400));
    const user=await User.findOne({email}).select('+password')
    if(!user) return next(new ErrorHandler("email incorrecte",401));

    const isPasswordMatched=await user.comparePswd(password);
    if(!isPasswordMatched) return next(new ErrorHandler("mot de passe incorrecte",401));
    sendToken(user,200,res)
})

exports.forgotPswd=catchAsyncError(async(req,res,next)=>{
    const user = await User.findOne({email:req.body.email});
    if(!user) return next(new ErrorHandler('email introuvable',404));
    const resetToken = user.getResetPswdToken();
    await user.save({validateBeforeSave:false});

    const resetUrl = `${req.protocol}://${req.get('host')}/reset/motDePasse/${resetToken}`
    const message = `Votre jeton de réinitialisation de mot de passe est le suivant : \n\n${resetUrl}\n\n si vous n'avez pas demandé cet e-mail, ignorez-le`

    try{
        await sendEmail({
            email:user.email,
            subject:'Luxe Store :: Récupération de mot de passe Luxe Store',
            message
        })
        res.status(200).json({
            success:true,
            message:'email envoyé à '+user.email
        })

    }catch(err){
        console.log(err)
        user.resetPasswordToken=undefined
        user.resetPasswordExpire=undefined
        await user.save({validateBeforeSave:false});
        return next(new ErrorHandler(err.message,500))
    }
})


exports.resetPswd=catchAsyncError(async(req,res,next)=>{
    const resetPasswordToken=crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{$gt:Date.now()} 
    });
    if(!user) return next(new ErrorHandler("Le jeton de réinitialisation du mot de passe n'est pas valide ou a expiré",404));
    if(req.body.password!==req.body.confirmPassword) return next(new ErrorHandler('Le mot de passe ne correspond pas',400));
    
    user.password=req.body.password;
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;
    await user.save();
    sendToken(user,200,res)
})


exports.updatePswd=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.user.id).select('+password');
    console.log(req.body)
    const isPasswordMatched=await user.comparePswd(req.body.oldPassword);
    if(!isPasswordMatched) return next(new ErrorHandler("ancien mot de passe est incorrect",401));
    user.password=req.body.password;
    await user.save();
    sendToken(user,200,res)
 
})

exports.updateProfile=catchAsyncError(async(req,res,next)=>{
    const newUserData=req.file?{
        name:req.body.name,
        email:req.body.email,
        avatar:req.file.filename
    }:{
        name:req.body.name,
        email:req.body.email,
    }
    const user=await User.findByIdAndUpdate(req.user.id,newUserData,{
        new: true,
        runValidators: true,
        useFindAndModify:false
    })
    res.status(200).json({
        success:true,
        user
    })
})

exports.getAllUsers=catchAsyncError(async(req,res,next)=>{
   
    const users=await User.find()
    res.status(200).json({
        success:true,
        users
    })
})

exports.getUser=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.params.id)
    if(!user) return next(new ErrorHandler('Utilsateur introuvable',404)) 
    res.status(200).json({
        success:true,
        user
    })
})

exports.updateUser=catchAsyncError(async(req,res,next)=>{
    const newUserData={
        name:req.body.name,
        email:req.body.email,
        role:req.body.role||'user'
    }
    const user=await User.findByIdAndUpdate(req.params.id,newUserData,{
        new: true,
        runValidators: true,
        useFindAndModify:false
    })
    res.status(200).json({
        success:true
    })
})

exports.deleteUser=catchAsyncError(async(req,res,next)=>{

    const user=await User.findById(req.params.id)
    if(!user) return next(new ErrorHandler('utilsateur introuvable',404)) 
    await user.remove()
    res.status(200).json({
        success:true,
        message:'utilsateur a supprimé'
    })
})

exports.logOut=catchAsyncError(async(req,res,next)=>{
    res.cookie('token',null,{
        expires:new Date(Date.now()),
        httpOnly:true
    })
    res.status(200).json({
        success:true,
        message:'déconnecté'
    })
})