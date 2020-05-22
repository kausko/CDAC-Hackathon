import React, {useState} from 'react';
import { DropzoneArea } from 'material-ui-dropzone';
import { Container, makeStyles, Button, Snackbar, Typography, Step, Stepper, StepLabel, StepContent, Paper, InputBase, Divider, IconButton, Grid} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import { ThemeContextConsumer } from '../../context/themer';
import SL from '../../images/SLn.svg';
import SD from '../../images/SDn.svg';
import { Search } from '@material-ui/icons';
import {SnackbarProvider, useSnackbar} from 'notistack';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import {useHistory} from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { getCookie } from '../../functions/cookiefns';

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        padding: '2px 4px',
        [theme.breakpoints.up('md')]: {
            width: '60%'
        },
        [theme.breakpoints.down('sm')]: {
            width: '90%'
        },
        margin: theme.spacing(2)
    },
    input: {
        marginLeft: theme.spacing(2),
        flex: 1,
      },
    iconButton: {
        padding: 10,
    },
    divider: {
        height: 28,
        margin: 4,
    },
    button: {
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    actionsContainer: {
      marginBottom: theme.spacing(2),
    },
    resetContainer: {
      padding: theme.spacing(3),
    },
    dropZoneDark: {
        backgroundColor: '#424242',
        color: 'white',
        marginTop: "1vh",
        minHeight: '20%',
        [theme.breakpoints.up('md')]: {
            maxWidth: '60%',
        },
        [theme.breakpoints.down('sm')]: {
            maxWidth: '90%',
        },
    },
    dropZoneLight: {
        marginTop: "1vh",
        minHeight: '20%',
        [theme.breakpoints.up('md')]: {
            maxWidth: '60%',
        },
        [theme.breakpoints.down('sm')]: {
            maxWidth: '90%',
        },
    },
    dZPara : {
        fontWeight: 300
    },
    img : {
        [theme.breakpoints.up('md')]: {
            maxWidth: '32%'
        },
        [theme.breakpoints.down('sm')]: {
            maxWidth: '80%'
        },
        maxHeight: 'auto'
    },
    stepper : {
        [theme.breakpoints.up('md')]: {
            width: '60%',
        },
        marginRight: '2.5%'
    },
    alert : {
        maxHeight: '100%',
        maxWidth: '100%',
        minWidth: 288,
        transition: theme.transitions.create(['top', 'right', 'bottom', 'left'], {
            easing: 'ease'
        }),
        [theme.breakpoints.down('sm')]: {
            left: '0 !important',
            right: '0 !important',
            width: '100%'
        }
    }
  }));
  
  
  
function VerticalLinearStepper() {

    const {enqueueSnackbar, closeSnackbar} = useSnackbar();
    
    const classes = useStyles();
    const history = useHistory();
    
    //stepper states
    const [activeStep, setActiveStep] = useState(0);
    const [disableCancel, setDisableCancel] = useState(false);

    // file status
    const [fileName, setFileName] = useState('');
    const [preSummary, setPreSummary] = useState('');

    // ocr status
    const [alertO, setAlertO] = useState(false);
    const [progressO, setProgressO] = useState(0);
    const [statusO, setStatusO] = useState('');

    const handleSubmit = () => {
        setDisableCancel(true);
        const cookie = getCookie("usertoken")
        console.log(fileName, preSummary);
        const uploadkey = enqueueSnackbar('Uploading...', {
            variant: 'info',
            persist: true
        })
        axios({
            method: "POST",
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${cookie}`
            },
            data: {
                "title": fileName,
                "content": preSummary,
                "email": cookie !== '' ? jwt_decode(cookie).identity.email : '',
            },
            url: "/api/summarise",
            onUploadProgress: (ev) => {
                const progress = Math.round(ev.loaded / ev.total * 100);
                if(progress === 100) {
                    closeSnackbar(uploadkey);
                    enqueueSnackbar('Summarizing...', {
                        variant: "info",
                        persist: true,
                    })
                }
            }
        })
        .then((response) => {
            console.log(response);
            sessionStorage.setItem('summary', response.data.data);
            closeSnackbar();
            enqueueSnackbar('Summarization successful', {
                persist: false,
                variant: "success",
            })
            setActiveStep(2);
        })
        .catch((err) => {
            closeSnackbar();
            enqueueSnackbar('Network Error, Please try again', {
                variant: "error",
            })
            console.log(err);
        });
    }
    
    const handleReset = () => {
        setActiveStep(0);
        //fileName = '';
        setFileName('');
        //preSummary = '';
        setPreSummary('');
        enqueueSnackbar('File removed', {
            variant: 'error'
        })
    }
  
    const steps = [
        'Select a file to summarize', 
        <Button 
            onClick = {handleSubmit} 
            disabled = {activeStep !== 1}
            variant = "contained"
            color = "primary"
            style = {{color: "white"}}
        >
            Upload
        </Button>,
        <Button 
            onClick = {() => {history.push('/viewsummary')}} 
            disabled = {activeStep !== 2}
            variant = "contained"
            color = "primary"
            style = {{color: "white"}}
        >
            View Summary
        </Button>
    ];
      
    function getStepContent(step) {
        switch (step) {
            case 0:
            return `Select a text file or an image`;
            case 1:
            return (
                <>
                <Button 
                    onClick = {handleReset}
                    variant = "contained"
                    color = "secondary"
                    style = {{marginRight: '-7px'}}
                    disabled = {disableCancel}
                >
                    Remove
                </Button>
                <Typography style = {{marginTop:'1vh'}}>{fileName}</Typography>
                </>
            );
            case 2:
            return `${getCookie("usertoken") !== "" ? "Summary added to 'My Summaries'" : "Login to store summaries"}`;
            default:
            return 'Unknown step';
        }
    }
  

    const handleChange = (event) => {
        const filetype = event[0].name.split('.').pop();

        if(filetype === 'txt'){
            var fileToLoad = event[0];
            var fileReader = new FileReader();

            fileReader.onload = (fileLoadedEvent) => {
                var textFromFileLoaded = fileLoadedEvent.target.result;
                //preSummary = textFromFileLoaded;
                setPreSummary(textFromFileLoaded);
            }

            if(fileToLoad){
                fileReader.readAsText(fileToLoad, "UTF-8");
                //fileName = event[0].name;
                setFileName(event[0].name);
            }
            setActiveStep(1);
            enqueueSnackbar('File added!', {
                variant: 'success'
            })
        }
        // else if(filetype === 'pdf'){
        //     console.log('pdf')
        // }
        // else if(filetype === 'doc' || filetype === 'docx'){
        //     console.log('doc');
        // }
        // else if(filetype === 'odt'){
        //     console.log('odt');
        // }
        else {
            console.log('img');
            setFileName(event[0].name);
            setAlertO(true);
            Tesseract.recognize(
                event[0],
                'eng',
                {
                    logger: m => {
                        console.log(m);
                        setStatusO(m.status);
                        setProgressO(Math.round(m.progress*100));
                    }
                }
            ).then(({data: {text}}) => {
                setPreSummary(text);
                setAlertO(false);
                setActiveStep(1);
                enqueueSnackbar('Text recognized!', {
                    variant: "success",
                });
            })
        }
    }
  
    return (
        <ThemeContextConsumer>
            {
                (themeContext) => (
                    <div 
                        style = {{
                            minHeight: "100vh",
                            backgroundColor: themeContext.dark && '#212121',
                            color: themeContext.dark && 'white',
                    }}>
                            <Grid
                                container
                                direction = "column"
                                justify = "flex-start"
                                alignItems = "center"
                            >

                            <img src={themeContext.dark ? SD : SL} alt="Summarize" className = {classes.img}/>

                            <DropzoneArea 
                                onDrop = {handleChange}
                                filesLimit = {1}
                                //showPreviews = {true}
                                showPreviewsInDropzone = {false}
                                //useChipsForPreview = {true}
                                acceptedFiles = {
                                    ['text/plain', /* 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text', 'application/pdf', */ 'image/bmp', 'image/jpeg', 'image/png']
                                }
                                dropzoneClass = {themeContext.dark ? classes.dropZoneDark : classes.dropZoneLight}
                                dropzoneParagraphClass = {classes.dZPara}
                                dropzoneText = "Drag/Click/Tap to select your file and summarize"
                                showAlerts = {false}
                            />

                            <Stepper 
                                className = {classes.stepper} 
                                activeStep={activeStep} 
                                orientation="vertical"
                                style = {{
                                    backgroundColor: themeContext.dark && '#212121',
                                    color: themeContext.dark && 'white'
                                }}
                                >
                                {
                                    steps.map((label, index) => (
                                        <Step key={label}>
                                        <StepLabel>
                                            <div style = {{
                                                backgroundColor: themeContext.dark && '#212121',
                                                color: themeContext.dark && 'white'
                                            }}>
                                                {label}
                                            </div>
                                        </StepLabel>
                                        <StepContent>
                                            <div>{getStepContent(index)}</div>
                                        </StepContent>
                                        </Step>
                                ))}
                            </Stepper>
                        <Snackbar 
                            open = {alertO}
                            anchorOrigin = {{horizontal: 'left', vertical: 'bottom'}}
                            >
                            <Alert 
                                variant = "filled" 
                                severity="info"
                                action = {progressO + '%'}
                                className = {classes.alert}
                            >
                                {statusO}
                            </Alert>
                        </Snackbar>
                        </Grid>
                    </div>
                )
            }
        </ThemeContextConsumer>
    );
  }

export default function Summarizer(){
    return(
        <SnackbarProvider 
            maxSnack = {1}>
            <VerticalLinearStepper/>
        </SnackbarProvider>
    );
}