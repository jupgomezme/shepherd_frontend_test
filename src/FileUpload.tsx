import React, { useState } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import { CloudUpload, Download } from '@mui/icons-material'
import { Snackbar, Alert, CircularProgress } from '@mui/material'


const FileUpload: React.FC = () => {
    const [outputLink, setOutputLink] = useState<string | null>(null)
    const [alertOpen, setAlertOpen] = useState<boolean>(false)
    const [alertMessage, setAlertMessage] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)

    const endpoint = 'https://ng6zxnwl5xa6n3vhm2bbcv46tu0yvhii.lambda-url.us-east-1.on.aws'

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type !== 'text/csv') {
            setAlertMessage('Please upload a CSV file.')
            setAlertOpen(true)
            return
        }

        if (file) {
            try {
                setLoading(true)
                const queryParams = new URLSearchParams({ key: file.name })

                const presignedUrlResponse = await fetch(
                    `${endpoint}?${queryParams.toString()}`
                )
                if (!presignedUrlResponse.ok) {
                    throw new Error('Failed to fetch presigned URL')
                }

                const { presigned_url: presignedUrl } = await presignedUrlResponse.json()

                const uploadResponse = await fetch(presignedUrl, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type,
                    },
                })

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload file')
                }

                const backendResponse = await fetch(
                    endpoint,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            link: presignedUrl.split('?')[0],
                        }),
                    }
                )

                if (!backendResponse.ok) {
                    throw new Error('Failed to fetch output link')
                }

                const { output_link: outputLink } = await backendResponse.json()

                setOutputLink(outputLink)

            } catch (error) {
                console.error(error)
                setAlertMessage('Something went wrong. Please try again.')
                setAlertOpen(true)
            } finally {
                setLoading(false)
            }
        }
    }


    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Paper elevation={3} sx={{ padding: 4, textAlign: 'center', maxWidth: 400 }}>
                    <Typography variant="h5" gutterBottom>
                        {outputLink ? 'Your file is ready!' : 'Upload your CSV file'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        {outputLink ? 'Download your normalized file' : 'We will normalize company names in your patent data'}
                    </Typography>
                    <Box sx={{ marginY: 2, border: '2px dashed #ccc', padding: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {loading ? (
                                <CircularProgress />
                            ) : outputLink ? (
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<Download />}
                                    href={outputLink}
                                    target="_blank"
                                    onClick={() => setOutputLink(null)}
                                >
                                    Download
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    component="label"
                                    startIcon={<CloudUpload />}
                                >
                                    Upload File
                                    <input
                                        type="file"
                                        accept=".csv"
                                        hidden
                                        onChange={handleFileChange}
                                    />
                                </Button>
                            )}
                            {!outputLink && (<Typography variant="caption" color="textSecondary" sx={{ marginTop: 2, textAlign: 'center' }}>
                                *Only CSV files are accepted <br />
                                <strong>Format:</strong> patent_id, organization, city, country
                            </Typography>)}
                        </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ marginTop: 2, textAlign: 'center' }}>
                        <a href="https://github.com/jupgomezme/shepherd_backend_test" target="_blank" rel="noopener noreferrer">
                            View source code on GitHub
                        </a>
                    </Typography>
                </Paper>
            </Box>

            <Snackbar
                open={alertOpen}
                autoHideDuration={4000}
                onClose={() => setAlertOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setAlertOpen(false)} severity="warning" variant="filled">
                    {alertMessage}
                </Alert>
            </Snackbar>
        </>
    )
}

export default FileUpload
