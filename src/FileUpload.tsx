import React, { useState } from 'react'
import { Box, Button } from '@mui/material'
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
            <Box sx={{ textAlign: 'center', padding: 4 }}>
                {loading ? (
                    <CircularProgress />
                ) : outputLink ? (
                    <Box sx={{ marginTop: 2 }}>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<Download />}
                            href={outputLink}
                            target="_blank"
                            onClick={() => setOutputLink(null)}
                        >
                            Download Output File
                        </Button>
                    </Box>
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
