/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useState, useEffect, useRef } from 'react';
import API from 'AppData/api';
import PropTypes from 'prop-types';
import Joi from '@hapi/joi';
import TextField from '@material-ui/core/TextField';
import DialogContentText from '@material-ui/core/DialogContentText';
import { FormattedMessage } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import FormDialogBase from 'AppComponents/AdminPages/Addons/FormDialogBase';
import Alert from 'AppComponents/Shared/Alert';

const useStyles = makeStyles((theme) => ({
    error: {
        color: theme.palette.error.dark,
    },
}));

/**
 * Perform a task repeatedly with a given interval
 * @param {function} callback function to be called
 * @param {Integer} delay interval
 */
function useInterval(callback, delay) {
    const savedCallback = useRef();
    savedCallback.current = callback;
    useEffect(() => {
        const id = setInterval(() => {
            savedCallback.current();
        }, delay);
        return () => clearInterval(id);
    }, []);
}

/**
 * Render a pop-up dialog to add an email address
 * @param {JSON} props .
 * @returns {JSX}.
 */
function AddEmail(props) {
    const {
        updateList, icon, triggerButtonText, title, emailList,
    } = props;
    const classes = useStyles();
    const [email, setEmail] = useState();
    const [validationRes, setValidationRes] = useState();
    const [elt, setElt] = useState(0);
    const [isValidated, setIsValidated] = useState(true);

    const onChange = (e) => {
        setEmail(e.target.value);
        setIsValidated(false);
        setElt(0);
    };

    const validateEmail = () => {
        let tempValidationRes = false;
        if (email === undefined) {
            tempValidationRes = false;
        }
        const schema = Joi.string().email().empty();
        const validationError = schema.validate(email).error;

        if (validationError) {
            const errorType = validationError.details[0].type;
            if (errorType === 'any.empty') {
                tempValidationRes = 'Email is empty';
            }
            if (errorType === 'string.email') {
                tempValidationRes = 'Invalid Email';
            }
        } else {
            const existingSameEmails = emailList.filter((obj) => obj.email === email);
            if (existingSameEmails.length > 0) {
                tempValidationRes = 'Same email exists';
            } else {
                tempValidationRes = false;
            }
        }
        setValidationRes(tempValidationRes);
        setIsValidated(true);
        return tempValidationRes;
    };

    useInterval(() => {
        if (!isValidated && elt >= 800) {
            validateEmail();
        }
        setElt(elt + 200);
    }, 200);

    const formSaveCallback = () => {
        const validationErrors = validateEmail(email);
        if (validationErrors) {
            Alert.error(validationErrors);
            return false;
        }

        const restApi = new API();
        const promiseAPICall = restApi.addBotDetectionNotifyingEmail(email);
        return promiseAPICall.then(() => {
            return (
                <FormattedMessage
                    id='AdminPages.BotDetection.Add.form.add.successful'
                    defaultMessage='Email added successfully'
                />
            );
        })
            .catch((error) => {
                const { response } = error;
                if (response.body) {
                    throw response.body.description;
                }
            })
            .finally(() => {
                updateList();
            });
    };

    return (
        <FormDialogBase
            title={title}
            saveButtonText='Save'
            icon={icon}
            triggerButtonText={triggerButtonText}
            formSaveCallback={formSaveCallback}
        >
            <DialogContentText>
                <FormattedMessage
                    id='AdminPages.BotDetection.Add.form.info'
                    defaultMessage='Provide a valid email to receive notifications when a bot attack is detected'
                />
            </DialogContentText>
            <TextField
                autoFocus
                margin='dense'
                name='email'
                value={email}
                onChange={onChange}
                onBlur={validateEmail}
                label={(
                    <span>
                        <FormattedMessage id='AdminPages.BotDetection.Add.form.email' defaultMessage='Email' />
                        <span className={classes.error}>*</span>
                    </span>
                )}
                fullWidth
                error={validationRes}
                helperText={validationRes || 'Enter Email address'}
                variant='outlined'
            />
        </FormDialogBase>
    );
}

AddEmail.defaultProps = {
    icon: null,
};

AddEmail.propTypes = {
    updateList: PropTypes.func.isRequired,
    icon: PropTypes.element,
    triggerButtonText: PropTypes.shape({}).isRequired,
    title: PropTypes.shape({}).isRequired,
    emailList: PropTypes.shape([]).isRequired,
};

export default AddEmail;
